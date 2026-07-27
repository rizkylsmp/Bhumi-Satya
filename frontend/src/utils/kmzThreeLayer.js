import * as THREE from "three";
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { strFromU8, unzipSync } from "fflate";
import maplibregl from "maplibre-gl";
import { resolveModelOffsetLocation } from "./model3dTransform";

export const DETAILED_MODEL_LAYER_ID = "asset-kmz-models-3d";

const normalizePath = (value = "") => decodeURIComponent(String(value))
  .replaceAll("\\", "/")
  .replace(/^\.\//, "")
  .replace(/^\//, "");

const contentTypeFor = (name) => {
  const extension = name.split(".").pop()?.toLowerCase();
  return {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    bin: "application/octet-stream",
  }[extension] || "application/octet-stream";
};

const getArchiveEntry = (entries, requestedPath, modelEntry) => {
  const normalized = normalizePath(requestedPath).split(/[?#]/)[0];
  if (entries[normalized]) return entries[normalized];
  const modelDirectory = normalizePath(modelEntry).split("/").slice(0, -1).join("/");
  const relative = normalizePath(`${modelDirectory}/${normalized}`);
  if (entries[relative]) return entries[relative];
  const basename = normalized.split("/").pop()?.toLowerCase();
  const matchingKey = Object.keys(entries).find(
    (key) => normalizePath(key).split("/").pop()?.toLowerCase() === basename,
  );
  return matchingKey ? entries[matchingKey] : null;
};

const parseGltf = (loader, data, modelType) => new Promise((resolve, reject) => {
  const input = modelType === "GLTF"
    ? strFromU8(data)
    : data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  loader.parse(input, "", (gltf) => resolve(gltf.scene), reject);
});

const createLitScene = (object, objectUrls = []) => {
  const scene = new THREE.Scene();
  scene.add(object);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 2.2));
  const sunlight = new THREE.DirectionalLight(0xffffff, 2.6);
  sunlight.position.set(50, -70, 100);
  scene.add(sunlight);
  return {
    scene,
    dispose: () => {
      object.traverse((child) => {
        child.geometry?.dispose?.();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.filter(Boolean).forEach((material) => {
          Object.values(material).forEach((value) => value?.isTexture && value.dispose());
          material.dispose?.();
        });
      });
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    },
  };
};

export const loadKmzScene = async (model, signal) => {
  if (model.conversion_status === "ready" && model.converted_public_url) {
    try {
      const response = await fetch(model.converted_public_url, { signal, mode: "cors" });
      if (!response.ok) throw new Error(`Unduhan GLB gagal (${response.status})`);
      const data = new Uint8Array(await response.arrayBuffer());
      const object = await parseGltf(new GLTFLoader(), data, "GLB");
      return createLitScene(object);
    } catch (error) {
      if (error.name === "AbortError") throw error;
      console.warn("GLB turunan gagal dimuat; mencoba KMZ asli:", error);
    }
  }

  const isDirectGlb = String(model.format || "").toUpperCase() === "GLB"
    || String(model.model_type || "").toUpperCase() === "GLB"
    || /\.glb(?:$|[?#])/i.test(model.original_name || model.public_url || "");
  if (isDirectGlb) {
    const response = await fetch(model.public_url, { signal, mode: "cors" });
    if (!response.ok) throw new Error(`Unduhan GLB gagal (${response.status})`);
    const data = new Uint8Array(await response.arrayBuffer());
    const object = await parseGltf(new GLTFLoader(), data, "GLB");
    return createLitScene(object);
  }

  const response = await fetch(model.public_url, { signal, mode: "cors" });
  if (!response.ok) throw new Error(`Unduhan KMZ gagal (${response.status})`);
  const entries = unzipSync(new Uint8Array(await response.arrayBuffer()));
  const modelEntry = normalizePath(model.manifest?.modelEntry || model.model_entry);
  const rawEntryKey = Object.keys(entries).find(
    (key) => normalizePath(key) === modelEntry,
  );
  if (!rawEntryKey) throw new Error("Model internal tidak ditemukan di dalam KMZ");

  const objectUrls = [];
  const manager = new THREE.LoadingManager();
  manager.setURLModifier((url) => {
    if (/^(blob:|data:|https?:)/i.test(url)) return url;
    const resource = getArchiveEntry(entries, url, modelEntry);
    if (!resource) return url;
    const objectUrl = URL.createObjectURL(new Blob([resource], {
      type: contentTypeFor(url),
    }));
    objectUrls.push(objectUrl);
    return objectUrl;
  });

  const modelType = String(model.model_type || modelEntry.split(".").pop()).toUpperCase();
  let object;
  if (modelType === "DAE") {
    object = new ColladaLoader(manager).parse(strFromU8(entries[rawEntryKey]), "").scene;
  } else if (modelType === "GLB" || modelType === "GLTF") {
    object = await parseGltf(new GLTFLoader(manager), entries[rawEntryKey], modelType);
  } else {
    throw new Error(`Model ${modelType} belum didukung viewer`);
  }

  return createLitScene(object, objectUrls);
};

const createTransformMatrix = (model) => {
  const { longitude, latitude, altitude } = resolveModelOffsetLocation(model);
  const coordinate = maplibregl.MercatorCoordinate.fromLngLat(
    [longitude, latitude],
    altitude,
  );
  const meterScale = coordinate.meterInMercatorCoordinateUnits();
  return new THREE.Matrix4()
    .makeTranslation(coordinate.x, coordinate.y, coordinate.z)
    .scale(new THREE.Vector3(
      meterScale * (Number(model.scale_x) || 1),
      -meterScale * (Number(model.scale_y) || 1),
      meterScale * (Number(model.scale_z) || 1),
    ))
    .multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2 + THREE.MathUtils.degToRad(Number(model.tilt) || 0)))
    .multiply(new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(Number(model.roll) || 0)))
    .multiply(new THREE.Matrix4().makeRotationZ(-THREE.MathUtils.degToRad(Number(model.heading) || 0)));
};

export const createKmzModelLayer = ({ models, onStatus }) => {
  const camera = new THREE.Camera();
  const loadedModels = [];
  const abortController = new AbortController();
  let renderer;
  let disposed = false;

  return {
    id: DETAILED_MODEL_LAYER_ID,
    type: "custom",
    renderingMode: "3d",
    onAdd(map, gl) {
      renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true,
      });
      renderer.autoClear = false;
      onStatus?.({ state: "loading", loaded: 0, total: models.length, failed: 0 });
      Promise.allSettled(models.map(async (model) => {
        const loaded = await loadKmzScene(model, abortController.signal);
        if (disposed) {
          loaded.dispose();
          return;
        }
        loadedModels.push({
          ...loaded,
          id: model.id_model_3d,
          transform: createTransformMatrix(model),
        });
        onStatus?.({
          state: "loading",
          loaded: loadedModels.length,
          total: models.length,
          failed: 0,
        });
        map.triggerRepaint();
      })).then((results) => {
        if (disposed) return;
        const failed = results.filter((result) => result.status === "rejected").length;
        onStatus?.({
          state: failed === models.length ? "error" : "ready",
          loaded: loadedModels.length,
          total: models.length,
          failed,
        });
        map.triggerRepaint();
      });
    },
    render(_gl, options) {
      if (!renderer || loadedModels.length === 0) return;
      const projection = new THREE.Matrix4().fromArray(
        options.defaultProjectionData?.mainMatrix || options.modelViewProjectionMatrix,
      );
      renderer.resetState();
      loadedModels.forEach((model) => {
        camera.projectionMatrix.copy(projection).multiply(model.transform);
        renderer.render(model.scene, camera);
      });
    },
    onRemove() {
      disposed = true;
      abortController.abort();
      loadedModels.forEach((model) => model.dispose());
      loadedModels.length = 0;
      renderer?.dispose();
      renderer = null;
    },
  };
};
