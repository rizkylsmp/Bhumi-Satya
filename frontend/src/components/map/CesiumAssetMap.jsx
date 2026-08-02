import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import {
  BoundingSphere,
  Cartesian3,
  Cartographic,
  Cesium3DTileColorBlendMode,
  Cesium3DTileset,
  Cesium3DTileStyle,
  Color,
  ColorBlendMode,
  EllipsoidTerrainProvider,
  GeoJsonDataSource,
  HeadingPitchRange,
  HeadingPitchRoll,
  ImageryLayer,
  Math as CesiumMath,
  Matrix4,
  Model,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Transforms,
  UrlTemplateImageryProvider,
  Viewer,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { resolveModelOffsetLocation } from "../../utils/model3dTransform";
import {
  DEFAULT_BASEMAP_ID,
  getBasemapOption,
} from "./basemapOptions";
import { DEFAULT_MAP_CENTER } from "./mapDefaults";

const getPropertyValue = (property) =>
  typeof property?.getValue === "function" ? property.getValue() : property;

const getModelFormat = (model = {}) =>
  String(model.format || model.model_type || "").toUpperCase();

const getModelUrl = (model = {}) =>
  model.converted_public_url || model.public_url || null;

const MODEL_VISUAL_STYLES = {
  default: { color: "#ffffff", blendAmount: 0.18 },
  hover: { color: "#38bdf8", blendAmount: 0.28 },
  selected: { color: "#2563eb", blendAmount: 0.36 },
};

const POLYGON_STYLES = {
  "Telah Bersertifikat": {
    fill: "#0ea5e9",
    outline: "#0369a1",
  },
  "Belum Bersertifikat": {
    fill: "#ef4444",
    outline: "#dc2626",
  },
  default: {
    fill: "#9ca3af",
    outline: "#6b7280",
  },
};

const getPolygonStyle = (entity) => {
  const status = String(
    getPropertyValue(entity?.properties?.["STATUS SERTIFIKAT"]) || "",
  ).trim();
  return POLYGON_STYLES[status] || POLYGON_STYLES.default;
};

const setModelVisualState = (target, state = "default") => {
  if (!target || target.isDestroyed?.()) return;
  const { color, blendAmount } =
    MODEL_VISUAL_STYLES[state] || MODEL_VISUAL_STYLES.default;
  if (target instanceof Cesium3DTileset) {
    target.style = new Cesium3DTileStyle({
      color: `color('${color}')`,
    });
    target.colorBlendMode = Cesium3DTileColorBlendMode.MIX;
    target.colorBlendAmount = blendAmount;
    return;
  }
  target.color = Color.fromCssColorString(color);
  target.colorBlendMode = ColorBlendMode.MIX;
  target.colorBlendAmount = blendAmount;
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

const focusSpheres = (viewer, spheres, duration = 0.8, close = false) => {
  if (!viewer || viewer.isDestroyed() || spheres.length === 0) return false;
  const sphere =
    spheres.length === 1
      ? spheres[0]
      : BoundingSphere.fromBoundingSpheres(spheres);
  viewer.camera.flyToBoundingSphere(sphere, {
    duration,
    offset: new HeadingPitchRange(
      CesiumMath.toRadians(25),
      CesiumMath.toRadians(-35),
      Math.max(close ? 80 : 150, sphere.radius * (close ? 2.1 : 2.8)),
    ),
  });
  return true;
};

const focusCoordinates = (
  viewer,
  location,
  duration = 0.8,
  close = false,
) => {
  if (!viewer || viewer.isDestroyed()) return false;
  const longitude = Number(location?.longitude);
  const latitude = Number(location?.latitude);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return false;
  const radius = Math.max(25, Number(location?.radius) || 100);
  const target = Cartesian3.fromDegrees(
    longitude,
    latitude,
    Number(location?.altitude) || 0,
  );
  const range = Math.max(close ? 180 : 350, radius * (close ? 2.4 : 3.2));
  const localFrame = Transforms.eastNorthUpToFixedFrame(target);
  const destination = Matrix4.multiplyByPoint(
    localFrame,
    new Cartesian3(0, -range * 0.65, range * 0.75),
    new Cartesian3(),
  );
  const direction = Cartesian3.normalize(
    Cartesian3.subtract(target, destination, new Cartesian3()),
    new Cartesian3(),
  );
  const surfaceNormal = Cartesian3.normalize(target, new Cartesian3());
  const right = Cartesian3.normalize(
    Cartesian3.cross(direction, surfaceNormal, new Cartesian3()),
    new Cartesian3(),
  );
  const up = Cartesian3.normalize(
    Cartesian3.cross(right, direction, new Cartesian3()),
    new Cartesian3(),
  );
  viewer.camera.flyTo({
    destination,
    duration,
    orientation: { direction, up },
  });
  return true;
};

const createBasemapProvider = (basemapId) => {
  const option = getBasemapOption(basemapId);
  if (!option?.cesiumUrl) return null;
  const provider = new UrlTemplateImageryProvider({
    url: option.cesiumUrl,
    credit: option.attribution,
    maximumLevel: option.maxzoom || 20,
  });
  provider.errorEvent.addEventListener((error) => {
    console.error(`Cesium basemap "${option.label}" tile failed:`, error);
  });
  return provider;
};

const CesiumAssetMap = forwardRef(function CesiumAssetMap(
  {
    assets = [],
    buildingGeoJson,
    polygonGeoJson,
    pointGeoJson,
    detailedModels = [],
    showMarkers = true,
    showPolygons = true,
    onFeatureClick,
    onOtherLayerClick,
    onStatusChange,
    basemapId = DEFAULT_BASEMAP_ID,
    analysisTool = null,
    analysisPoints = [],
    onAnalysisClick,
  },
  forwardedRef,
) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const basemapIdRef = useRef(basemapId);
  const targetSpheresRef = useRef([]);
  const targetSphereByLocationIdRef = useRef(new Map());
  const targetModelByLocationIdRef = useRef(new Map());
  const pendingFocusLocationRef = useRef(null);
  const fallbackTargetRef = useRef(null);
  const hoveredModelRef = useRef(null);
  const selectedModelRef = useRef(null);
  const assetsRef = useRef(assets);
  const onFeatureClickRef = useRef(onFeatureClick);
  const onOtherLayerClickRef = useRef(onOtherLayerClick);
  const onStatusChangeRef = useRef(onStatusChange);
  const analysisToolRef = useRef(analysisTool);
  const onAnalysisClickRef = useRef(onAnalysisClick);
  const analysisEntityIdsRef = useRef([]);

  useEffect(() => {
    assetsRef.current = assets;
    onFeatureClickRef.current = onFeatureClick;
    onOtherLayerClickRef.current = onOtherLayerClick;
    onStatusChangeRef.current = onStatusChange;
    analysisToolRef.current = analysisTool;
    onAnalysisClickRef.current = onAnalysisClick;
  }, [
    analysisTool,
    assets,
    onAnalysisClick,
    onFeatureClick,
    onOtherLayerClick,
    onStatusChange,
  ]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    analysisEntityIdsRef.current.forEach((id) => {
      viewer.entities.removeById(id);
    });
    analysisEntityIdsRef.current = [];

    const positions = analysisPoints
      .map((point) => {
        const longitude = Number(point?.[0]);
        const latitude = Number(point?.[1]);
        return Number.isFinite(longitude) && Number.isFinite(latitude)
          ? Cartesian3.fromDegrees(longitude, latitude, 1.5)
          : null;
      })
      .filter(Boolean);

    positions.forEach((position, index) => {
      const id = `analysis-point-${index}`;
      viewer.entities.add({
        id,
        position,
        point: {
          color: Color.fromCssColorString("#f59e0b"),
          outlineColor: Color.WHITE,
          outlineWidth: 2,
          pixelSize: 10,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
      analysisEntityIdsRef.current.push(id);
    });

    if (positions.length > 1) {
      const id = "analysis-line";
      viewer.entities.add({
        id,
        polyline: {
          positions,
          width: 3,
          material: Color.fromCssColorString("#f59e0b"),
          clampToGround: true,
        },
      });
      analysisEntityIdsRef.current.push(id);
    }
    viewer.scene.requestRender();
  }, [analysisPoints]);

  useEffect(() => {
    basemapIdRef.current = basemapId;
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    const option = getBasemapOption(basemapId);
    const provider = createBasemapProvider(option.id);
    viewer.imageryLayers.removeAll();
    if (provider) viewer.imageryLayers.addImageryProvider(provider);
    viewer.scene.globe.baseColor = Color.fromCssColorString(
      option.backgroundColor || "#cbd5e1",
    );
    viewer.scene.requestRender();
  }, [basemapId]);

  useImperativeHandle(
    forwardedRef,
    () => ({
      focus(location = null) {
        pendingFocusLocationRef.current = location;
        const viewer = viewerRef.current;
        if (!viewer || viewer.isDestroyed()) return Boolean(location);
        const targetModel = location?.id
          ? targetModelByLocationIdRef.current.get(String(location.id))
          : null;
        if (targetModel) {
          const previousSelected = selectedModelRef.current;
          selectedModelRef.current = targetModel;
          if (previousSelected && previousSelected !== targetModel) {
            setModelVisualState(
              previousSelected,
              previousSelected === hoveredModelRef.current
                ? "hover"
                : "default",
            );
          }
          setModelVisualState(targetModel, "selected");
          viewer.scene.requestRender();
        }
        const targetSphere = location?.id
          ? targetSphereByLocationIdRef.current.get(String(location.id))
          : null;
        if (targetSphere && focusSpheres(viewer, [targetSphere], 0.8, true)) {
          pendingFocusLocationRef.current = null;
          return true;
        }
        if (focusCoordinates(viewer, location, 0.8, Boolean(location))) {
          pendingFocusLocationRef.current = null;
          return true;
        }
        if (focusSpheres(viewer, targetSpheresRef.current)) return true;
        if (fallbackTargetRef.current) {
          viewer.flyTo(fallbackTargetRef.current, { duration: 0.8 });
          return true;
        }
        return false;
      },
      clearSelection() {
        const viewer = viewerRef.current;
        const previousSelected = selectedModelRef.current;
        selectedModelRef.current = null;
        setModelVisualState(
          previousSelected,
          previousSelected === hoveredModelRef.current ? "hover" : "default",
        );
        if (viewer && !viewer.isDestroyed()) viewer.scene.requestRender();
      },
      setView(mode) {
        const viewer = viewerRef.current;
        const spheres = targetSpheresRef.current;
        if (!viewer || viewer.isDestroyed()) return false;
        let target;
        if (spheres.length > 0) {
          target = spheres.length === 1
            ? spheres[0]
            : BoundingSphere.fromBoundingSpheres(spheres);
        } else {
          const fallbackAsset = assetsRef.current.find((asset) => {
            const longitude = Number(
              asset?.active_model_3d?.location_long
                ?? asset?.koordinat_long
                ?? asset?.longitude
                ?? asset?.lng,
            );
            const latitude = Number(
              asset?.active_model_3d?.location_lat
                ?? asset?.koordinat_lat
                ?? asset?.latitude
                ?? asset?.lat,
            );
            return Number.isFinite(longitude) && Number.isFinite(latitude);
          });
          const longitude = Number(
            fallbackAsset?.active_model_3d?.location_long
              ?? fallbackAsset?.koordinat_long
              ?? fallbackAsset?.longitude
              ?? fallbackAsset?.lng
              ?? DEFAULT_MAP_CENTER[0],
          );
          const latitude = Number(
            fallbackAsset?.active_model_3d?.location_lat
              ?? fallbackAsset?.koordinat_lat
              ?? fallbackAsset?.latitude
              ?? fallbackAsset?.lat
              ?? DEFAULT_MAP_CENTER[1],
          );
          target = new BoundingSphere(
            Cartesian3.fromDegrees(longitude, latitude),
            350,
          );
        }
        const heading = mode === "north" ? 0 : CesiumMath.toRadians(25);
        const pitch =
          mode === "top"
            ? CesiumMath.toRadians(-89)
            : CesiumMath.toRadians(-35);
        viewer.camera.lookAt(
          target.center,
          new HeadingPitchRange(
            heading,
            pitch,
            Math.max(150, target.radius * 2.8),
          ),
        );
        viewer.scene.requestRender();
        return true;
      },
      zoomIn() {
        const viewer = viewerRef.current;
        if (!viewer || viewer.isDestroyed()) return false;
        const height = viewer.camera.positionCartographic.height;
        viewer.camera.zoomIn(Math.max(25, height * 0.3));
        viewer.scene.requestRender();
        return true;
      },
      zoomOut() {
        const viewer = viewerRef.current;
        if (!viewer || viewer.isDestroyed()) return false;
        const height = viewer.camera.positionCartographic.height;
        viewer.camera.zoomOut(Math.max(25, height * 0.3));
        viewer.scene.requestRender();
        return true;
      },
    }),
    [],
  );

  useEffect(() => {
    if (!containerRef.current) return undefined;

    let cancelled = false;
    let viewer;
    let resizeObserver;
    let clickHandler;
    const targetSpheres = [];
    const targetSphereByLocationId = new Map();
    const targetModelByLocationId = new Map();

    const initialize = async () => {
      onStatusChangeRef.current?.({
        state: detailedModels.length > 0 ? "loading" : "idle",
        loaded: 0,
        total: detailedModels.length,
        failed: 0,
      });

      const basemapOption = getBasemapOption(basemapIdRef.current);
      const basemapProvider = createBasemapProvider(basemapOption.id);
      viewer = new Viewer(containerRef.current, {
        animation: false,
        baseLayer: basemapProvider ? new ImageryLayer(basemapProvider) : false,
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
      viewer.scene.backgroundColor = Color.fromCssColorString("#dce7ef");
      viewer.scene.globe.show = true;
      viewer.scene.globe.baseColor = Color.fromCssColorString(
        basemapOption.backgroundColor || "#cbd5e1",
      );
      viewer.scene.globe.depthTestAgainstTerrain = false;
      viewer.scene.globe.showGroundAtmosphere = false;
      viewer.camera.setView({
        destination: Cartesian3.fromDegrees(
          DEFAULT_MAP_CENTER[0],
          DEFAULT_MAP_CENTER[1],
          1250,
        ),
        orientation: {
          heading: CesiumMath.toRadians(25),
          pitch: CesiumMath.toRadians(-45),
          roll: 0,
        },
      });

      resizeObserver = new ResizeObserver(() => {
        if (!viewer.isDestroyed()) viewer.resize();
      });
      resizeObserver.observe(containerRef.current);

      if (buildingGeoJson?.features?.length) {
        const buildings = await GeoJsonDataSource.load(buildingGeoJson, {
          clampToGround: false,
        });
        if (cancelled) return;
        buildings.entities.values.forEach((entity) => {
          if (!entity.polygon) return;
          const height = Number(
            getPropertyValue(entity.properties?.height_m),
          );
          entity.polygon.height = 0;
          entity.polygon.extrudedHeight =
            Number.isFinite(height) && height > 0 ? height : 10;
          entity.polygon.material = Color.fromCssColorString("#7c3aed").withAlpha(
            0.72,
          );
          entity.polygon.outline = true;
          entity.polygon.outlineColor = Color.fromCssColorString("#ede9fe");
        });
        await viewer.dataSources.add(buildings);
        fallbackTargetRef.current = buildings;
      }

      if (showPolygons && polygonGeoJson?.features?.length) {
        const polygons = await GeoJsonDataSource.load(polygonGeoJson, {
          clampToGround: true,
          fill: Color.fromCssColorString(POLYGON_STYLES.default.fill).withAlpha(
            0.15,
          ),
          stroke: Color.fromCssColorString(POLYGON_STYLES.default.outline),
          strokeWidth: 1,
        });
        if (cancelled) return;
        polygons.entities.values.forEach((entity) => {
          if (!entity.polygon) return;
          const style = getPolygonStyle(entity);
          entity.polygon.material = Color.fromCssColorString(
            style.fill,
          ).withAlpha(0.15);
          entity.polygon.outline = true;
          entity.polygon.outlineColor = Color.fromCssColorString(style.outline);
          entity.polygon.outlineWidth = 1;
        });
        await viewer.dataSources.add(polygons);
        fallbackTargetRef.current ||= polygons;
      }

      if (showMarkers && pointGeoJson?.features?.length) {
        const points = await GeoJsonDataSource.load(pointGeoJson, {
          clampToGround: true,
          markerColor: Color.fromCssColorString("#0ea5e9"),
          markerSize: 20,
        });
        if (cancelled) return;
        await viewer.dataSources.add(points);
        fallbackTargetRef.current ||= points;
      }

      let loaded = 0;
      let failed = 0;
      for (const model of detailedModels) {
        if (cancelled) return;
        try {
          const modelUrl = getModelUrl(model);
          if (!modelUrl) throw new Error("URL model belum tersedia");

          if (getModelFormat(model) === "3DTILES") {
            const tileset = await Cesium3DTileset.fromUrl(modelUrl);
            if (cancelled) {
              tileset.destroy();
              return;
            }
            tileset.assetId = model.assetId;
            viewer.scene.primitives.add(tileset);
            setModelVisualState(tileset);
            targetSpheres.push(tileset.boundingSphere);
            if (model.locationId) {
              targetSphereByLocationId.set(
                String(model.locationId),
                tileset.boundingSphere,
              );
              targetModelByLocationId.set(String(model.locationId), tileset);
            }
          } else {
            const location = resolveModelOffsetLocation(model);
            if (
              !Number.isFinite(location.longitude) ||
              !Number.isFinite(location.latitude)
            ) {
              throw new Error("Koordinat model belum tersedia");
            }
            const primitive = await Model.fromGltfAsync({
              url: model.converted_public_url || modelUrl,
              modelMatrix: createModelMatrix(model, location),
              backFaceCulling: false,
              cull: false,
              allowPicking: true,
            });
            if (cancelled) {
              primitive.destroy();
              return;
            }
            primitive.assetId = model.assetId;
            viewer.scene.primitives.add(primitive);
            await waitForModelReady(primitive);
            setModelVisualState(primitive);
            targetSpheres.push(primitive.boundingSphere);
            if (model.locationId) {
              targetSphereByLocationId.set(
                String(model.locationId),
                primitive.boundingSphere,
              );
              targetModelByLocationId.set(String(model.locationId), primitive);
            }
          }
          loaded += 1;
        } catch (error) {
          failed += 1;
          console.error("Cesium asset model failed:", error);
        }
        onStatusChangeRef.current?.({
          state:
            loaded + failed < detailedModels.length
              ? "loading"
              : loaded > 0
                ? "ready"
                : "error",
          loaded,
          total: detailedModels.length,
          failed,
        });
      }

      targetSpheresRef.current = targetSpheres;
      targetSphereByLocationIdRef.current = targetSphereByLocationId;
      targetModelByLocationIdRef.current = targetModelByLocationId;
      const pendingLocation = pendingFocusLocationRef.current;
      const pendingSphere = pendingLocation?.id
        ? targetSphereByLocationId.get(String(pendingLocation.id))
        : null;
      const pendingModel = pendingLocation?.id
        ? targetModelByLocationId.get(String(pendingLocation.id))
        : null;
      if (pendingModel) {
        selectedModelRef.current = pendingModel;
        setModelVisualState(pendingModel, "selected");
      }
      if (!cancelled && pendingSphere) {
        focusSpheres(viewer, [pendingSphere], 0.7, true);
        pendingFocusLocationRef.current = null;
      } else if (!cancelled && pendingLocation && focusCoordinates(
        viewer,
        pendingLocation,
        0.7,
        true,
      )) {
        pendingFocusLocationRef.current = null;
      } else if (!cancelled && detailedModels.length > 0 && focusCoordinates(
        viewer,
        (() => {
          const model = detailedModels[0];
          const location = resolveModelOffsetLocation(model);
          return {
            longitude: location.longitude,
            latitude: location.latitude,
            altitude: location.altitude,
            radius: model.converted_bounds?.radius,
          };
        })(),
        0.7,
      )) {
        pendingFocusLocationRef.current = null;
      } else if (!cancelled && targetSpheres.length > 0) {
        focusSpheres(viewer, targetSpheres, 0.7);
      } else if (!cancelled && fallbackTargetRef.current) {
        await viewer.zoomTo(fallbackTargetRef.current);
      }
      viewer.scene.requestRender();

      clickHandler = new ScreenSpaceEventHandler(viewer.scene.canvas);
      clickHandler.setInputAction((movement) => {
        if (analysisToolRef.current) {
          const previousHovered = hoveredModelRef.current;
          hoveredModelRef.current = null;
          setModelVisualState(
            previousHovered,
            previousHovered === selectedModelRef.current
              ? "selected"
              : "default",
          );
          viewer.scene.canvas.style.cursor = "crosshair";
          return;
        }
        const picked = viewer.scene.pick(movement.endPosition);
        const nextHoveredModel =
          (picked?.primitive?.assetId && picked.primitive) ||
          (picked?.tileset?.assetId && picked.tileset) ||
          null;
        if (nextHoveredModel === hoveredModelRef.current) return;
        const previousHovered = hoveredModelRef.current;
        hoveredModelRef.current = nextHoveredModel;
        setModelVisualState(
          previousHovered,
          previousHovered === selectedModelRef.current
            ? "selected"
            : "default",
        );
        setModelVisualState(
          nextHoveredModel,
          nextHoveredModel === selectedModelRef.current
            ? "selected"
            : "hover",
        );
        viewer.scene.canvas.style.cursor = nextHoveredModel ? "pointer" : "";
        viewer.scene.requestRender();
      }, ScreenSpaceEventType.MOUSE_MOVE);
      clickHandler.setInputAction((movement) => {
        const picked = viewer.scene.pick(movement.position);
        const entity = picked?.id;
        const pickedAssetId =
          getPropertyValue(entity?.properties?.id_aset) ??
          picked?.primitive?.assetId ??
          picked?.tileset?.assetId;
        const asset = assetsRef.current.find(
          (item) =>
            String(item?.id_aset || item?.id) === String(pickedAssetId),
        );
        if (analysisToolRef.current) {
          const cartesian = viewer.scene.pickPositionSupported
            ? viewer.scene.pickPosition(movement.position)
            : viewer.camera.pickEllipsoid(
                movement.position,
                viewer.scene.globe.ellipsoid,
              );
          const fallbackCartesian = cartesian || viewer.camera.pickEllipsoid(
            movement.position,
            viewer.scene.globe.ellipsoid,
          );
          if (fallbackCartesian) {
            const cartographic = Cartographic.fromCartesian(fallbackCartesian);
            onAnalysisClickRef.current?.({
              longitude: CesiumMath.toDegrees(cartographic.longitude),
              latitude: CesiumMath.toDegrees(cartographic.latitude),
              asset: asset || null,
            });
          }
          return;
        }
        if (asset) {
          const pickedModel =
            (picked?.primitive?.assetId && picked.primitive) ||
            (picked?.tileset?.assetId && picked.tileset) ||
            null;
          const previousSelected = selectedModelRef.current;
          selectedModelRef.current = pickedModel;
          if (previousSelected && previousSelected !== pickedModel) {
            setModelVisualState(
              previousSelected,
              previousSelected === hoveredModelRef.current
                ? "hover"
                : "default",
            );
          }
          setModelVisualState(pickedModel, "selected");
          viewer.scene.requestRender();
          onFeatureClickRef.current?.(asset);
        } else {
          onOtherLayerClickRef.current?.();
        }
      }, ScreenSpaceEventType.LEFT_CLICK);
    };

    initialize().catch((error) => {
      if (cancelled) return;
      console.error("Cesium asset map failed:", error);
      onStatusChangeRef.current?.({
        state: "error",
        loaded: 0,
        total: detailedModels.length,
        failed: detailedModels.length,
        message: error.message,
      });
    });

    return () => {
      cancelled = true;
      clickHandler?.destroy();
      resizeObserver?.disconnect();
      targetSpheresRef.current = [];
      targetSphereByLocationIdRef.current = new Map();
      targetModelByLocationIdRef.current = new Map();
      fallbackTargetRef.current = null;
      hoveredModelRef.current = null;
      selectedModelRef.current = null;
      viewerRef.current = null;
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
    };
  }, [
    buildingGeoJson,
    detailedModels,
    pointGeoJson,
    polygonGeoJson,
    showMarkers,
    showPolygons,
  ]);

  return <div ref={containerRef} className="h-full w-full" />;
});

export default CesiumAssetMap;
