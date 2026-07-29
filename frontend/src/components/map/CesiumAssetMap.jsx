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
  Math as CesiumMath,
  Matrix4,
  Model,
  OpenStreetMapImageryProvider,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Transforms,
  Viewer,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { resolveModelOffsetLocation } from "../../utils/model3dTransform";
import { DEFAULT_MAP_CENTER } from "./mapDefaults";

const getPropertyValue = (property) =>
  typeof property?.getValue === "function" ? property.getValue() : property;

const getModelFormat = (model = {}) =>
  String(model.format || model.model_type || "").toUpperCase();

const getModelUrl = (model = {}) =>
  model.converted_public_url || model.public_url || null;

const setModelHoverColor = (target, hovered) => {
  if (!target || target.isDestroyed?.()) return;
  const color = hovered ? "#334155" : "#ffffff";
  const blendAmount = hovered ? 0.24 : 0.18;
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

const focusSpheres = (viewer, spheres, duration = 0.8) => {
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
      Math.max(150, sphere.radius * 2.8),
    ),
  });
  return true;
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
    analysisTool = null,
    analysisPoints = [],
    onAnalysisClick,
  },
  forwardedRef,
) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const targetSpheresRef = useRef([]);
  const fallbackTargetRef = useRef(null);
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

  useImperativeHandle(
    forwardedRef,
    () => ({
      focus(location = null) {
        const viewer = viewerRef.current;
        if (!viewer || viewer.isDestroyed()) return false;
        const longitude = Number(location?.longitude);
        const latitude = Number(location?.latitude);
        if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
          viewer.camera.flyTo({
            destination: Cartesian3.fromDegrees(longitude, latitude, 850),
            orientation: {
              heading: CesiumMath.toRadians(25),
              pitch: CesiumMath.toRadians(-35),
              roll: 0,
            },
            duration: 0.8,
          });
          return true;
        }
        if (focusSpheres(viewer, targetSpheresRef.current)) return true;
        if (fallbackTargetRef.current) {
          viewer.flyTo(fallbackTargetRef.current, { duration: 0.8 });
          return true;
        }
        return false;
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
    let hoveredModel;
    const targetSpheres = [];

    const initialize = async () => {
      onStatusChangeRef.current?.({
        state: detailedModels.length > 0 ? "loading" : "idle",
        loaded: 0,
        total: detailedModels.length,
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
      viewer.scene.backgroundColor = Color.fromCssColorString("#dce7ef");
      viewer.scene.globe.depthTestAgainstTerrain = false;
      viewer.scene.globe.showGroundAtmosphere = false;
      viewer.imageryLayers.addImageryProvider(
        new OpenStreetMapImageryProvider({
          url: "https://tile.openstreetmap.org/",
        }),
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
          fill: Color.fromCssColorString("#38bdf8").withAlpha(0.12),
          stroke: Color.fromCssColorString("#0284c7").withAlpha(0.9),
          strokeWidth: 2,
        });
        if (cancelled) return;
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
            setModelHoverColor(tileset, false);
            targetSpheres.push(tileset.boundingSphere);
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
            setModelHoverColor(primitive, false);
            targetSpheres.push(primitive.boundingSphere);
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
      if (!cancelled && targetSpheres.length > 0) {
        focusSpheres(viewer, targetSpheres, 0.7);
      } else if (!cancelled && fallbackTargetRef.current) {
        await viewer.zoomTo(fallbackTargetRef.current);
      }

      clickHandler = new ScreenSpaceEventHandler(viewer.scene.canvas);
      clickHandler.setInputAction((movement) => {
        if (analysisToolRef.current) {
          setModelHoverColor(hoveredModel, false);
          hoveredModel = null;
          viewer.scene.canvas.style.cursor = "crosshair";
          return;
        }
        const picked = viewer.scene.pick(movement.endPosition);
        const nextHoveredModel =
          (picked?.primitive?.assetId && picked.primitive) ||
          (picked?.tileset?.assetId && picked.tileset) ||
          null;
        if (nextHoveredModel === hoveredModel) return;
        setModelHoverColor(hoveredModel, false);
        hoveredModel = nextHoveredModel;
        setModelHoverColor(hoveredModel, true);
        viewer.scene.canvas.style.cursor = hoveredModel ? "pointer" : "";
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
        if (asset) onFeatureClickRef.current?.(asset);
        else onOtherLayerClickRef.current?.();
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
      setModelHoverColor(hoveredModel, false);
      resizeObserver?.disconnect();
      targetSpheresRef.current = [];
      fallbackTargetRef.current = null;
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
