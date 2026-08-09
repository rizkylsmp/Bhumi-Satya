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
  JulianDate,
  Math as CesiumMath,
  Matrix4,
  Model,
  Rectangle,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  ShadowMode,
  SingleTileImageryProvider,
  SunLight,
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

const setEntityVisualState = (entity, state = "default") => {
  if (!entity) return;
  if (entity.polygon) {
    const style = getPolygonStyle(entity);
    const selected = state === "selected";
    entity.polygon.material = Color.fromCssColorString(
      selected ? "#facc15" : style.fill,
    ).withAlpha(state === "hover" ? 0.45 : selected ? 0.36 : 0.15);
    entity.polygon.outlineColor = Color.fromCssColorString(
      selected ? "#eab308" : style.outline,
    );
    entity.polygon.outlineWidth = state === "hover" ? 1.8 : selected ? 2 : 1;
  }
  if (entity.billboard) {
    entity.billboard.scale = state === "default" ? 1 : 1.15;
  }
  if (entity.point) {
    entity.point.pixelSize = state === "default" ? 10 : 12;
  }
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

const createBasemapProvider = async (basemapId, suppliedOption = null) => {
  const option = suppliedOption || getBasemapOption(basemapId);
  if (option?.kind === "single-image") {
    const bounds = option.bounds;
    if (!option.imageUrl || !bounds) return null;
    return SingleTileImageryProvider.fromUrl(option.imageUrl, {
      rectangle: Rectangle.fromDegrees(
        bounds.west,
        bounds.south,
        bounds.east,
        bounds.north,
      ),
      credit: option.attribution,
    });
  }
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

const getBasemapSignature = (option = {}) => JSON.stringify({
  id: option.id || "",
  kind: option.kind || "",
  cesiumUrl: option.cesiumUrl || "",
  imageUrl: option.imageUrl || "",
  bounds: option.bounds || null,
  opacity: option.opacity ?? 1,
});

const getSimulationAppearance = (simulationDate) => {
  if (!simulationDate) {
    return {
      brightness: 1,
      contrast: 1,
      saturation: 1,
      sunlightIntensity: 2,
    };
  }
  const jakartaHours = (
    simulationDate.getUTCHours()
    + 7
    + simulationDate.getUTCMinutes() / 60
  ) % 24;
  const sunrise = 5.5;
  const sunset = 18.5;
  const daylightPosition = jakartaHours > sunrise && jakartaHours < sunset
    ? (jakartaHours - sunrise) / (sunset - sunrise)
    : 0;
  const daylight = daylightPosition > 0
    ? Math.pow(Math.sin(daylightPosition * Math.PI), 0.55)
    : 0;

  return {
    brightness: 0.32 + daylight * 0.76,
    contrast: 0.94 + daylight * 0.08,
    saturation: 0.58 + daylight * 0.42,
    sunlightIntensity: 0.5 + daylight * 1.5,
  };
};

const applyShadowAnalysis = (viewer, enabled, dateTime) => {
  if (!viewer || viewer.isDestroyed()) return;
  const isEnabled = Boolean(enabled);
  const numericDateTime = Number(dateTime);
  const simulationDate = dateTime == null || !Number.isFinite(numericDateTime)
    ? null
    : new Date(numericDateTime);

  viewer.shadows = isEnabled;
  viewer.scene.shadowMap.enabled = isEnabled;
  viewer.scene.shadowMap.softShadows = isEnabled;
  viewer.scene.shadowMap.darkness = 0.26;
  viewer.scene.shadowMap.fadingEnabled = true;
  viewer.scene.shadowMap.normalOffset = true;
  viewer.scene.shadowMap.maximumDistance = 2800;
  if (isEnabled) {
    viewer.scene.shadowMap.size = Math.min(
      2048,
      viewer.scene.context.maximumTextureSize || 2048,
    );
  }
  viewer.scene.highDynamicRange = false;
  viewer.scene.gamma = 2.2;
  viewer.scene.globe.enableLighting = isEnabled;
  viewer.scene.globe.showGroundAtmosphere = false;
  viewer.scene.globe.dynamicAtmosphereLighting = false;
  viewer.scene.globe.dynamicAtmosphereLightingFromSun = false;
  viewer.scene.globe.shadows = isEnabled
    ? ShadowMode.RECEIVE_ONLY
    : ShadowMode.DISABLED;
  const appearance = getSimulationAppearance(simulationDate);
  viewer.scene.light = new SunLight({
    color: Color.WHITE,
    intensity: isEnabled ? appearance.sunlightIntensity : 2,
  });
  for (let index = 0; index < viewer.imageryLayers.length; index += 1) {
    const layer = viewer.imageryLayers.get(index);
    layer.brightness = isEnabled ? appearance.brightness : 1;
    layer.contrast = isEnabled ? appearance.contrast : 1;
    layer.saturation = isEnabled ? appearance.saturation : 1;
  }
  viewer.clock.shouldAnimate = false;
  if (simulationDate && !Number.isNaN(simulationDate.getTime())) {
    viewer.clock.currentTime = JulianDate.fromDate(simulationDate);
  }
  viewer.scene.requestRender();
};

const CesiumAssetMap = forwardRef(function CesiumAssetMap(
  {
    assets = [],
    buildingGeoJson,
    polygonGeoJson,
    pointGeoJson,
    detailedModels = [],
    visibleLocationIds = null,
    showMarkers = true,
    showPolygons = true,
    onFeatureClick,
    onOtherLayerClick,
    onStatusChange,
    onBearingChange,
    basemapId = DEFAULT_BASEMAP_ID,
    basemapOption = null,
    analysisTool = null,
    analysisPoints = [],
    shadowEnabled = false,
    shadowDateTime = null,
    onAnalysisClick,
  },
  forwardedRef,
) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const polygonDataSourceRef = useRef(null);
  const pointDataSourceRef = useRef(null);
  const showMarkersRef = useRef(showMarkers);
  const showPolygonsRef = useRef(showPolygons);
  const visibleLocationIdsRef = useRef(
    visibleLocationIds === null
      ? null
      : new Set(visibleLocationIds.map(String)),
  );
  const shadowEnabledRef = useRef(shadowEnabled);
  const shadowDateTimeRef = useRef(shadowDateTime);
  const basemapIdRef = useRef(basemapId);
  const basemapOptionRef = useRef(basemapOption);
  const appliedBasemapSignatureRef = useRef("");
  const targetSpheresRef = useRef([]);
  const targetSphereByLocationIdRef = useRef(new Map());
  const targetModelByLocationIdRef = useRef(new Map());
  const assetEntityByIdRef = useRef(new Map());
  const pendingFocusLocationRef = useRef(null);
  const fallbackTargetRef = useRef(null);
  const hoveredModelRef = useRef(null);
  const hoveredEntityRef = useRef(null);
  const selectedModelRef = useRef(null);
  const selectedEntityRef = useRef(null);
  const assetsRef = useRef(assets);
  const onFeatureClickRef = useRef(onFeatureClick);
  const onOtherLayerClickRef = useRef(onOtherLayerClick);
  const onStatusChangeRef = useRef(onStatusChange);
  const onBearingChangeRef = useRef(onBearingChange);
  const analysisToolRef = useRef(analysisTool);
  const onAnalysisClickRef = useRef(onAnalysisClick);
  const analysisEntityIdsRef = useRef([]);

  useEffect(() => {
    assetsRef.current = assets;
    onFeatureClickRef.current = onFeatureClick;
    onOtherLayerClickRef.current = onOtherLayerClick;
    onStatusChangeRef.current = onStatusChange;
    onBearingChangeRef.current = onBearingChange;
    analysisToolRef.current = analysisTool;
    onAnalysisClickRef.current = onAnalysisClick;
  }, [
    analysisTool,
    assets,
    onAnalysisClick,
    onFeatureClick,
    onOtherLayerClick,
    onBearingChange,
    onStatusChange,
  ]);

  useEffect(() => {
    showMarkersRef.current = showMarkers;
    showPolygonsRef.current = showPolygons;
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (polygonDataSourceRef.current) {
      polygonDataSourceRef.current.show = showPolygons;
    }
    if (pointDataSourceRef.current) {
      pointDataSourceRef.current.show = showMarkers;
    }
    viewer.scene.requestRender();
  }, [showMarkers, showPolygons]);

  useEffect(() => {
    const visibleIds = visibleLocationIds === null
      ? null
      : new Set(visibleLocationIds.map(String));
    visibleLocationIdsRef.current = visibleIds;

    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    targetModelByLocationIdRef.current.forEach((model, locationId) => {
      model.show = visibleIds === null || visibleIds.has(String(locationId));
    });
    viewer.scene.requestRender();
  }, [visibleLocationIds]);

  useEffect(() => {
    shadowEnabledRef.current = shadowEnabled;
    shadowDateTimeRef.current = shadowDateTime;
    applyShadowAnalysis(viewerRef.current, shadowEnabled, shadowDateTime);
  }, [shadowDateTime, shadowEnabled]);

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
    basemapOptionRef.current = basemapOption;
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    let cancelled = false;
    const apply = async () => {
      const option = basemapOption || getBasemapOption(basemapId);
      const signature = getBasemapSignature(option);
      if (appliedBasemapSignatureRef.current === signature) return;
      const provider = await createBasemapProvider(option.id, option);
      if (cancelled || viewer.isDestroyed()) return;
      const previousLayers = Array.from(
        { length: viewer.imageryLayers.length },
        (_, index) => viewer.imageryLayers.get(index),
      );
      if (provider) {
        viewer.imageryLayers.addImageryProvider(provider, 0);
      }
      previousLayers.forEach((layer) => {
        if (viewer.imageryLayers.contains(layer)) {
          viewer.imageryLayers.remove(layer, true);
        }
      });
      viewer.scene.globe.baseColor = Color.fromCssColorString(
        option.backgroundColor || "#cbd5e1",
      );
      appliedBasemapSignatureRef.current = signature;
      applyShadowAnalysis(
        viewer,
        shadowEnabledRef.current,
        shadowDateTimeRef.current,
      );
    };
    apply().catch((error) => console.error("Could not switch Cesium basemap:", error));
    return () => {
      cancelled = true;
    };
  }, [basemapId, basemapOption]);

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
        const targetEntity = location?.assetId
          ? assetEntityByIdRef.current.get(String(location.assetId))
          : null;
        if (targetEntity) {
          const previousSelectedEntity = selectedEntityRef.current;
          selectedEntityRef.current = targetEntity;
          if (previousSelectedEntity && previousSelectedEntity !== targetEntity) {
            setEntityVisualState(
              previousSelectedEntity,
              previousSelectedEntity === hoveredEntityRef.current
                ? "hover"
                : "default",
            );
          }
          setEntityVisualState(targetEntity, "selected");
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
        const previousSelectedEntity = selectedEntityRef.current;
        selectedModelRef.current = null;
        selectedEntityRef.current = null;
        setModelVisualState(
          previousSelected,
          previousSelected === hoveredModelRef.current ? "hover" : "default",
        );
        setEntityVisualState(
          previousSelectedEntity,
          previousSelectedEntity === hoveredEntityRef.current
            ? "hover"
            : "default",
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
      resetNorth() {
        const viewer = viewerRef.current;
        if (!viewer || viewer.isDestroyed()) return false;
        viewer.camera.flyTo({
          destination: Cartesian3.clone(viewer.camera.positionWC),
          orientation: {
            heading: 0,
            pitch: viewer.camera.pitch,
            roll: 0,
          },
          duration: 0.45,
        });
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
    let removeBearingListener;
    const targetSpheres = [];
    const targetSphereByLocationId = new Map();
    const targetModelByLocationId = new Map();
    const assetEntityById = new Map();

    const initialize = async () => {
      onStatusChangeRef.current?.({
        state: detailedModels.length > 0 ? "loading" : "idle",
        loaded: 0,
        total: detailedModels.length,
        failed: 0,
      });

      const activeBasemapOption = basemapOptionRef.current
        || getBasemapOption(basemapIdRef.current);
      const basemapProvider = await createBasemapProvider(
        activeBasemapOption.id,
        activeBasemapOption,
      );
      // React StrictMode immediately cleans up the first development effect.
      // Stop that stale async initialization before it creates a second Viewer
      // inside the same container.
      if (cancelled || !containerRef.current) return;
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
        requestRenderMode: true,
        maximumRenderTimeChange: Number.POSITIVE_INFINITY,
      });
      viewerRef.current = viewer;
      appliedBasemapSignatureRef.current = getBasemapSignature(
        activeBasemapOption,
      );
      viewer.scene.backgroundColor = Color.fromCssColorString("#dce7ef");
      viewer.scene.globe.show = true;
      viewer.scene.globe.baseColor = Color.fromCssColorString(
        activeBasemapOption.backgroundColor || "#cbd5e1",
      );
      viewer.scene.globe.depthTestAgainstTerrain = false;
      viewer.scene.globe.showGroundAtmosphere = false;
      applyShadowAnalysis(
        viewer,
        shadowEnabledRef.current,
        shadowDateTimeRef.current,
      );
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
      viewer.camera.percentageChanged = 0.01;
      const reportBearing = () => {
        const degrees = CesiumMath.toDegrees(viewer.camera.heading);
        const normalized = ((((degrees + 180) % 360) + 360) % 360) - 180;
        onBearingChangeRef.current?.(normalized);
      };
      removeBearingListener = viewer.camera.changed.addEventListener(reportBearing);
      reportBearing();

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
          entity.polygon.shadows = ShadowMode.ENABLED;
        });
        await viewer.dataSources.add(buildings);
        fallbackTargetRef.current = buildings;
      }

      if (polygonGeoJson?.features?.length) {
        const polygons = await GeoJsonDataSource.load(polygonGeoJson, {
          clampToGround: true,
          fill: Color.fromCssColorString(POLYGON_STYLES.default.fill).withAlpha(
            0.15,
          ),
          stroke: Color.fromCssColorString(POLYGON_STYLES.default.outline),
          strokeWidth: 1,
        });
        if (cancelled) return;
        polygons.show = showPolygonsRef.current;
        polygons.entities.values.forEach((entity) => {
          if (!entity.polygon) return;
          const style = getPolygonStyle(entity);
          entity.polygon.material = Color.fromCssColorString(
            style.fill,
          ).withAlpha(0.15);
          entity.polygon.outline = true;
          entity.polygon.outlineColor = Color.fromCssColorString(style.outline);
          entity.polygon.outlineWidth = 1;
          entity.polygon.shadows = ShadowMode.DISABLED;
          if (entity.id != null) assetEntityById.set(String(entity.id), entity);
        });
        await viewer.dataSources.add(polygons);
        polygonDataSourceRef.current = polygons;
        fallbackTargetRef.current ||= polygons;
      }

      if (pointGeoJson?.features?.length) {
        const points = await GeoJsonDataSource.load(pointGeoJson, {
          clampToGround: true,
          markerColor: Color.fromCssColorString("#0ea5e9"),
          markerSize: 20,
        });
        if (cancelled) return;
        points.show = showMarkersRef.current;
        points.entities.values.forEach((entity) => {
          if (entity.id != null && !assetEntityById.has(String(entity.id))) {
            assetEntityById.set(String(entity.id), entity);
          }
        });
        await viewer.dataSources.add(points);
        pointDataSourceRef.current = points;
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
            tileset.modelData = model;
            tileset.shadows = ShadowMode.ENABLED;
            tileset.show = visibleLocationIdsRef.current === null
              || !model.locationId
              || visibleLocationIdsRef.current.has(String(model.locationId));
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
            primitive.modelData = model;
            primitive.shadows = ShadowMode.ENABLED;
            primitive.show = visibleLocationIdsRef.current === null
              || !model.locationId
              || visibleLocationIdsRef.current.has(String(model.locationId));
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
      assetEntityByIdRef.current = assetEntityById;
      const pendingLocation = pendingFocusLocationRef.current;
      const pendingSphere = pendingLocation?.id
        ? targetSphereByLocationId.get(String(pendingLocation.id))
        : null;
      const pendingModel = pendingLocation?.id
        ? targetModelByLocationId.get(String(pendingLocation.id))
        : null;
      const pendingEntity = pendingLocation?.assetId
        ? assetEntityById.get(String(pendingLocation.assetId))
        : null;
      if (pendingModel) {
        selectedModelRef.current = pendingModel;
        setModelVisualState(pendingModel, "selected");
      }
      if (pendingEntity) {
        selectedEntityRef.current = pendingEntity;
        setEntityVisualState(pendingEntity, "selected");
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
          const visibleIds = visibleLocationIdsRef.current;
          const model = detailedModels.find((candidate) =>
            visibleIds === null
            || !candidate.locationId
            || visibleIds.has(String(candidate.locationId))) || detailedModels[0];
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
          const previousHoveredEntity = hoveredEntityRef.current;
          hoveredModelRef.current = null;
          hoveredEntityRef.current = null;
          setModelVisualState(
            previousHovered,
            previousHovered === selectedModelRef.current
              ? "selected"
              : "default",
          );
          setEntityVisualState(
            previousHoveredEntity,
            previousHoveredEntity === selectedEntityRef.current
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
        const pickedEntity = picked?.id || null;
        const pickedEntityAssetId =
          getPropertyValue(pickedEntity?.properties?.id_aset) ??
          pickedEntity?.id;
        const nextHoveredEntity = pickedEntityAssetId != null
          && assetsRef.current.some(
            (item) =>
              String(item?.id_aset || item?.id) === String(pickedEntityAssetId),
          )
          ? pickedEntity
          : null;
        if (
          nextHoveredModel === hoveredModelRef.current
          && nextHoveredEntity === hoveredEntityRef.current
        ) {
          viewer.scene.canvas.style.cursor =
            nextHoveredModel || nextHoveredEntity ? "pointer" : "";
          return;
        }
        const previousHovered = hoveredModelRef.current;
        const previousHoveredEntity = hoveredEntityRef.current;
        hoveredModelRef.current = nextHoveredModel;
        hoveredEntityRef.current = nextHoveredEntity;
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
        setEntityVisualState(
          previousHoveredEntity,
          previousHoveredEntity === selectedEntityRef.current
            ? "selected"
            : "default",
        );
        setEntityVisualState(
          nextHoveredEntity,
          nextHoveredEntity === selectedEntityRef.current
            ? "selected"
            : "hover",
        );
        viewer.scene.canvas.style.cursor =
          nextHoveredModel || nextHoveredEntity ? "pointer" : "";
        viewer.scene.requestRender();
      }, ScreenSpaceEventType.MOUSE_MOVE);
      clickHandler.setInputAction((movement) => {
        const picked = viewer.scene.pick(movement.position);
        const entity = picked?.id;
        const pickedAssetId =
          getPropertyValue(entity?.properties?.id_aset) ??
          entity?.id ??
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
          const selectedEntity =
            (entity && String(entity.id) === String(pickedAssetId)
              ? entity
              : assetEntityByIdRef.current.get(String(pickedAssetId))) || null;
          const previousSelectedEntity = selectedEntityRef.current;
          selectedModelRef.current = pickedModel;
          selectedEntityRef.current = selectedEntity;
          if (previousSelected && previousSelected !== pickedModel) {
            setModelVisualState(
              previousSelected,
              previousSelected === hoveredModelRef.current
                ? "hover"
                : "default",
            );
          }
          if (previousSelectedEntity && previousSelectedEntity !== selectedEntity) {
            setEntityVisualState(
              previousSelectedEntity,
              previousSelectedEntity === hoveredEntityRef.current
                ? "hover"
                : "default",
            );
          }
          setModelVisualState(pickedModel, "selected");
          setEntityVisualState(selectedEntity, "selected");
          viewer.scene.requestRender();
          const selectedModel = pickedModel?.modelData || null;
          onFeatureClickRef.current?.({
            ...asset,
            popup_context: selectedModel ? "3d" : "2d",
            ...(selectedModel ? { active_model_3d: selectedModel } : {}),
          });
        } else {
          const previousSelected = selectedModelRef.current;
          const previousSelectedEntity = selectedEntityRef.current;
          selectedModelRef.current = null;
          selectedEntityRef.current = null;
          setModelVisualState(
            previousSelected,
            previousSelected === hoveredModelRef.current ? "hover" : "default",
          );
          setEntityVisualState(
            previousSelectedEntity,
            previousSelectedEntity === hoveredEntityRef.current
              ? "hover"
              : "default",
          );
          viewer.scene.requestRender();
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
      removeBearingListener?.();
      resizeObserver?.disconnect();
      targetSpheresRef.current = [];
      targetSphereByLocationIdRef.current = new Map();
      targetModelByLocationIdRef.current = new Map();
      fallbackTargetRef.current = null;
      hoveredModelRef.current = null;
      selectedModelRef.current = null;
      polygonDataSourceRef.current = null;
      pointDataSourceRef.current = null;
      appliedBasemapSignatureRef.current = "";
      viewerRef.current = null;
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
    };
  }, [
    buildingGeoJson,
    detailedModels,
    pointGeoJson,
    polygonGeoJson,
  ]);

  return <div ref={containerRef} className="h-full w-full" />;
});

export default CesiumAssetMap;
