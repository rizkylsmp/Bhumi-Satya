import { useEffect, useRef } from "react";
import {
  Cartesian3,
  Cesium3DTileset,
  Color,
  EllipsoidTerrainProvider,
  HeadingPitchRange,
  HeadingPitchRoll,
  Math as CesiumMath,
  Matrix4,
  Model,
  Transforms,
  UrlTemplateImageryProvider,
  Viewer,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { resolveModelOffsetLocation } from "../../utils/model3dTransform";
import { DEFAULT_MAP_CENTER } from "./mapDefaults";
import {
  DEFAULT_BASEMAP_ID,
  getBasemapOption,
} from "./basemapOptions";

const assetLocation = (asset = {}) => ({
  longitude: Number(
    asset.koordinat_long ?? asset.lng ?? asset.longitude,
  ),
  latitude: Number(
    asset.koordinat_lat ?? asset.lat ?? asset.latitude,
  ),
  altitude: Number(asset.building_base_elevation_m) || 0,
});

const isFiniteLocation = ({ longitude, latitude }) =>
  Number.isFinite(longitude) &&
  Number.isFinite(latitude) &&
  Math.abs(longitude) <= 180 &&
  Math.abs(latitude) <= 90;

const getModelUrl = (model = {}) =>
  model.converted_public_url || model.public_url || null;

const getModelFormat = (model = {}) =>
  String(model.format || model.model_type || "").toUpperCase();

const createBasemapProvider = (basemapId) => {
  const option = getBasemapOption(basemapId);
  if (!option?.cesiumUrl) return null;
  return new UrlTemplateImageryProvider({
    url: option.cesiumUrl,
    credit: option.attribution,
    maximumLevel: option.maxzoom || 20,
  });
};

const applyBasemap = (viewer, basemapId) => {
  if (!viewer || viewer.isDestroyed()) return;
  const option = getBasemapOption(basemapId);
  viewer.imageryLayers.removeAll(true);
  const provider = createBasemapProvider(option.id);
  if (provider) viewer.imageryLayers.addImageryProvider(provider);
  const background = Color.fromCssColorString(
    option.backgroundColor || "#cbd5e1",
  );
  viewer.scene.backgroundColor = background;
  viewer.scene.globe.baseColor = background;
  viewer.scene.requestRender();
};

const createModelMatrix = (model, location) => {
  const origin = Cartesian3.fromDegrees(
    location.longitude,
    location.latitude,
    location.altitude,
  );
  const orientation = new HeadingPitchRoll(
    CesiumMath.toRadians(Number(model.heading) || 0),
    CesiumMath.toRadians(Number(model.tilt) || 0),
    CesiumMath.toRadians(Number(model.roll) || 0),
  );
  const matrix = Transforms.headingPitchRollToFixedFrame(origin, orientation);
  return Matrix4.multiplyByScale(
    matrix,
    new Cartesian3(
      Number(model.scale_x) || 1,
      Number(model.scale_y) || 1,
      Number(model.scale_z) || 1,
    ),
    matrix,
  );
};

const focusBoundingSphere = (viewer, sphere) => {
  if (!viewer || viewer.isDestroyed() || !sphere) return;
  viewer.camera.flyToBoundingSphere(sphere, {
    duration: 0.7,
    offset: new HeadingPitchRange(
      CesiumMath.toRadians(25),
      CesiumMath.toRadians(-35),
      Math.max(120, sphere.radius * 2.6),
    ),
  });
};

const waitForModelReady = (model) => {
  if (model.ready) return Promise.resolve(model);

  return new Promise((resolve, reject) => {
    let removeReadyListener;
    let removeErrorListener;

    const cleanup = () => {
      removeReadyListener?.();
      removeErrorListener?.();
    };

    removeReadyListener = model.readyEvent.addEventListener(() => {
      cleanup();
      resolve(model);
    });
    removeErrorListener = model.errorEvent.addEventListener((error) => {
      cleanup();
      reject(error);
    });
  });
};

export default function CesiumModelPreview({
  asset,
  model,
  focusRequestKey,
  onStatusChange,
  basemapId = DEFAULT_BASEMAP_ID,
}) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const targetRef = useRef(null);
  const modelRef = useRef(model);
  const assetRef = useRef(asset);
  const onStatusChangeRef = useRef(onStatusChange);
  const basemapIdRef = useRef(basemapId);
  const modelLoadKey = [
    model?.id_model_3d || "no-model",
    getModelUrl(model || {}) || "no-url",
    getModelFormat(model || {}) || "no-format",
    asset?.id_aset || asset?.id || "no-asset",
  ].join(":");

  useEffect(() => {
    modelRef.current = model;
    assetRef.current = asset;
    onStatusChangeRef.current = onStatusChange;
  }, [asset, model, onStatusChange]);

  useEffect(() => {
    basemapIdRef.current = basemapId;
    applyBasemap(viewerRef.current, basemapId);
  }, [basemapId]);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    let cancelled = false;
    let viewer;
    let resizeObserver;

    const initialize = async () => {
      const currentModel = modelRef.current;
      const currentAsset = assetRef.current;
      onStatusChangeRef.current?.({
        state: currentModel ? "loading" : "idle",
        loaded: 0,
        total: currentModel ? 1 : 0,
        failed: 0,
      });

      viewer = new Viewer(containerRef.current, {
        animation: false,
        baseLayer: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        navigationHelpButton: false,
        scene3DOnly: true,
        sceneModePicker: false,
        selectionIndicator: false,
        shouldAnimate: false,
        timeline: false,
        terrainProvider: new EllipsoidTerrainProvider(),
      });
      viewerRef.current = viewer;
      viewer.scene.globe.depthTestAgainstTerrain = false;
      viewer.scene.globe.showGroundAtmosphere = false;
      applyBasemap(viewer, basemapIdRef.current);

      resizeObserver = new ResizeObserver(() => {
        if (!viewer.isDestroyed()) viewer.resize();
      });
      resizeObserver.observe(containerRef.current);

      const fallbackLocation = assetLocation(currentAsset);
      if (!currentModel) {
        const cameraLocation = isFiniteLocation(fallbackLocation)
          ? fallbackLocation
          : {
              longitude: DEFAULT_MAP_CENTER[0],
              latitude: DEFAULT_MAP_CENTER[1],
            };
        viewer.camera.flyTo({
          destination: Cartesian3.fromDegrees(
            cameraLocation.longitude,
            cameraLocation.latitude,
            850,
          ),
          duration: 0,
        });
        return;
      }

      const modelUrl = getModelUrl(currentModel);
      if (!modelUrl) {
        throw new Error("URL model hasil konversi belum tersedia");
      }

      const resolvedLocation = resolveModelOffsetLocation(currentModel);
      const location = isFiniteLocation(resolvedLocation)
        ? resolvedLocation
        : fallbackLocation;
      if (!isFiniteLocation(location)) {
        throw new Error("Koordinat model 3D belum tersedia");
      }

      if (getModelFormat(currentModel) === "3DTILES") {
        const tileset = await Cesium3DTileset.fromUrl(modelUrl);
        if (cancelled || viewer.isDestroyed()) {
          tileset.destroy();
          return;
        }
        viewer.scene.primitives.add(tileset);
        targetRef.current = tileset;
        await viewer.zoomTo(tileset);
      } else {
        if (!currentModel.converted_public_url) {
          throw new Error(
            "Preview Cesium memerlukan GLB hasil konversi dari KMZ",
          );
        }
        const primitive = await Model.fromGltfAsync({
          url: currentModel.converted_public_url,
          modelMatrix: createModelMatrix(currentModel, location),
          backFaceCulling: false,
          cull: false,
          minimumPixelSize: 0,
          allowPicking: true,
        });
        if (cancelled || viewer.isDestroyed()) {
          primitive.destroy();
          return;
        }
        primitive.backFaceCulling = false;
        viewer.scene.primitives.add(primitive);
        await waitForModelReady(primitive);
        if (cancelled || viewer.isDestroyed()) return;
        const latestModel = modelRef.current;
        const latestResolvedLocation = resolveModelOffsetLocation(latestModel);
        const latestLocation = isFiniteLocation(latestResolvedLocation)
          ? latestResolvedLocation
          : assetLocation(assetRef.current);
        if (isFiniteLocation(latestLocation)) {
          primitive.modelMatrix = createModelMatrix(
            latestModel,
            latestLocation,
          );
        }
        targetRef.current = primitive;
        focusBoundingSphere(viewer, primitive.boundingSphere);
      }

      onStatusChangeRef.current?.({
        state: "ready",
        loaded: 1,
        total: 1,
        failed: 0,
      });
    };

    initialize().catch((error) => {
      if (cancelled) return;
      console.error("Cesium model preview failed:", error);
      const currentModel = modelRef.current;
      onStatusChangeRef.current?.({
        state: "error",
        loaded: 0,
        total: currentModel ? 1 : 0,
        failed: currentModel ? 1 : 0,
        message: error.message,
      });
    });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      targetRef.current = null;
      viewerRef.current = null;
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
    };
  }, [modelLoadKey]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const target = targetRef.current;
    if (
      !viewer ||
      viewer.isDestroyed() ||
      !target ||
      target instanceof Cesium3DTileset ||
      !model
    ) {
      return;
    }
    const fallbackLocation = assetLocation(asset);
    const resolvedLocation = resolveModelOffsetLocation(model);
    const location = isFiniteLocation(resolvedLocation)
      ? resolvedLocation
      : fallbackLocation;
    if (!isFiniteLocation(location)) return;
    target.modelMatrix = createModelMatrix(model, location);
    viewer.scene.requestRender();
  }, [
    asset,
    model,
    model?.altitude_m,
    model?.heading,
    model?.location_lat,
    model?.location_long,
    model?.offset_x_m,
    model?.offset_y_m,
    model?.offset_z_m,
    model?.roll,
    model?.scale_x,
    model?.scale_y,
    model?.scale_z,
    model?.tilt,
  ]);

  useEffect(() => {
    if (!focusRequestKey || !viewerRef.current || !targetRef.current) return;
    const viewer = viewerRef.current;
    const target = targetRef.current;
    if (target instanceof Cesium3DTileset) {
      viewer.zoomTo(target);
      return;
    }
    focusBoundingSphere(viewer, target.boundingSphere);
  }, [focusRequestKey]);

  return (
    <div className="relative h-full w-full bg-slate-200">
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute bottom-7 left-2 rounded-md border border-white/60 bg-slate-950/75 px-2 py-1 text-[8px] font-extrabold uppercase tracking-wide text-white backdrop-blur">
        Preview Cesium
      </div>
    </div>
  );
}
