import { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  BuildingsIcon,
  CaretDownIcon,
  ImageIcon,
  MapPinIcon,
  MapTrifoldIcon,
  PolygonIcon,
  StackIcon,
  XIcon,
} from "@phosphor-icons/react";
import BPNLayerControl from "./BPNLayerControl";
import Model3dControlPanel from "./Model3dControlPanel";
import Switch from "../../ui/Switch";
import {
  buildAssetBuildingFeature,
  buildAssetBuildingFeatureCollection,
  getAsset3dSummary,
  hasUsableAsset3dData,
  resolveAssetBuildingHeight,
} from "../../../utils/asset3dGeojson";
import {
  buildAnalysisFeatureCollection,
  distanceMeters,
  formatMetricValue,
  geometryAreaSquareMeters,
  lineDistanceMeters,
} from "../../../utils/mapAnalysis";
import {
  getModelFocusZoom,
  resolveModelOffsetLocation,
} from "../../../utils/model3dTransform";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "../mapDefaults";
import CesiumAssetMap from "../CesiumAssetMap";
import "./mapLibreStyles.css";

const CERTIFIED_STATUS = "Telah Bersertifikat";
const UNCERTIFIED_STATUS = "Belum Bersertifikat";
const SELECTED_BIDANG_SOURCE_ID = "selected-bidang";
const SELECTED_BIDANG_FILL_LAYER_ID = "selected-bidang-fill";
const SELECTED_BIDANG_LINE_LAYER_ID = "selected-bidang-line";
const EMPTY_FEATURE_COLLECTION = {
  type: "FeatureCollection",
  features: [],
};
const MAPLIBRE_STYLE_URL =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const MAPLIBRE_BASEMAP_ID = "maplibre";
const BASEMAP_RASTER_SOURCE_ID = "selected-basemap-raster";
const BASEMAP_RASTER_LAYER_ID = "selected-basemap-raster-layer";
const DETAILED_MODEL_LAYER_ID = "asset-kmz-models-3d";
const ANALYSIS_SOURCE_ID = "map-analysis";
const ANALYSIS_FILL_LAYER_ID = "map-analysis-fill";
const ANALYSIS_LINE_LAYER_ID = "map-analysis-line";
const ANALYSIS_POINT_LAYER_ID = "map-analysis-point";
const ANALYSIS_LABEL_LAYER_ID = "map-analysis-label";
const CUSTOM_OVERLAY_SOURCE_IDS = new Set([
  "batas_wilayah",
  "batas_kecamatan",
  "bidang_tanah",
  "rdtr",
  "znt",
  "asset-dots",
  SELECTED_BIDANG_SOURCE_ID,
  BASEMAP_RASTER_SOURCE_ID,
  ANALYSIS_SOURCE_ID,
]);
const BASEMAP_OPTIONS = [
  {
    id: MAPLIBRE_BASEMAP_ID,
    label: "Map Libre",
  },
  {
    id: "osm",
    label: "OSM",
    tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
    tileSize: 256,
    maxzoom: 19,
    attribution: "OpenStreetMap contributors",
  },
  {
    id: "esri",
    label: "ESRI",
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    ],
    tileSize: 256,
    maxzoom: 19,
    attribution: "Esri",
  },
  {
    id: "foto_udara",
    label: "Foto Udara",
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    tileSize: 256,
    maxzoom: 19,
    attribution:
      "Esri, Maxar, Earthstar Geographics, and the GIS User Community",
  },
];

function LayerSwitch({
  checked,
  onChange,
  icon,
  label,
  tone,
  iconClass,
}) {
  return (
    <div
      className={`flex h-9 w-full items-center gap-1.5 rounded-lg border px-2 text-left transition-all ${
        checked
          ? "border-accent/25 bg-accent/5 dark:border-accent/40 dark:bg-accent/10"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/80 dark:hover:border-slate-600 dark:hover:bg-slate-800"
      }`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
          checked
            ? iconClass
            : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
        }`}
      >
        {createElement(icon, {
          size: 13,
          weight: checked ? "fill" : "regular",
        })}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[9px] font-bold text-slate-800 dark:text-slate-100">
          {label}
        </span>
      </span>
      <Switch
        size="sm"
        tone={tone}
        checked={checked}
        onCheckedChange={onChange}
        aria-label={`${checked ? "Sembunyikan" : "Tampilkan"} ${label}`}
      />
    </div>
  );
}

const toUpper = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const normalizeCertificateStatus = (status, certificateNumber) => {
  const statusText = toUpper(status);
  if (statusText.includes("BELUM")) return UNCERTIFIED_STATUS;
  if (statusText.includes("TELAH") || statusText.includes("SUDAH")) {
    return CERTIFIED_STATUS;
  }

  const certificateText = String(certificateNumber || "").trim();
  return certificateText.length > 10 ? CERTIFIED_STATUS : UNCERTIFIED_STATUS;
};

const getPolygonPoints = (rawPolygon, coordinateOrder = "latLng") => {
  if (!rawPolygon) return [];

  if (typeof rawPolygon === "string") {
    try {
      return getPolygonPoints(JSON.parse(rawPolygon), coordinateOrder);
    } catch {
      return [];
    }
  }

  if (Array.isArray(rawPolygon)) {
    const [first, second] = rawPolygon;
    const firstNumber = Number(first);
    const secondNumber = Number(second);

    if (Number.isFinite(firstNumber) && Number.isFinite(secondNumber)) {
      return coordinateOrder === "lngLat"
        ? [[secondNumber, firstNumber]]
        : [[firstNumber, secondNumber]];
    }

    return rawPolygon.flatMap((item) =>
      getPolygonPoints(item, coordinateOrder),
    );
  }

  if (typeof rawPolygon === "object") {
    const lat = Number(rawPolygon.lat ?? rawPolygon.latitude);
    const lng = Number(rawPolygon.lng ?? rawPolygon.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return [[lat, lng]];
    }

    if (rawPolygon.coordinates) {
      return getPolygonPoints(rawPolygon.coordinates, "lngLat");
    }

    if (rawPolygon.geometry) {
      return getPolygonPoints(rawPolygon.geometry, coordinateOrder);
    }

    if (rawPolygon.features) {
      return getPolygonPoints(rawPolygon.features, coordinateOrder);
    }
  }

  return [];
};

const normalizePolygonRing = (rawPolygon) => {
  const ring = getPolygonPoints(rawPolygon).map(([lat, lng]) => [lng, lat]);

  if (ring.length < 3) {
    return null;
  }

  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([...first]);
  }

  return ring;
};

const parseCoordinateValue = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const isValidLngLat = (lng, lat) => {
  return (
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90 &&
    !(lng === 0 && lat === 0)
  );
};

const getAssetPointLngLat = (asset) => {
  const lat = parseCoordinateValue(asset?.latitude ?? asset?.lat);
  const lng = parseCoordinateValue(asset?.longitude ?? asset?.lng);
  if (isValidLngLat(lng, lat)) {
    return [lng, lat];
  }

  const ring = normalizePolygonRing(
    asset?.polygon || asset?.polygon_bidang || asset?.polygon_sewa,
  );
  if (!ring || ring.length < 3) return null;

  const points =
    ring.length > 1 &&
    ring[0][0] === ring[ring.length - 1][0] &&
    ring[0][1] === ring[ring.length - 1][1]
      ? ring.slice(0, -1)
      : ring;

  const lngSum = points.reduce((sum, point) => sum + point[0], 0);
  const latSum = points.reduce((sum, point) => sum + point[1], 0);
  return [lngSum / points.length, latSum / points.length];
};

const getAssetFeatureId = (asset) => {
  const id = asset?.id ?? asset?.id_aset;
  return id === null || id === undefined ? null : String(id);
};

const hasVisibleDotCoordinates = (featureCollection) =>
  Boolean(
    featureCollection?.features?.some((feature) => {
      const coordinates = feature?.geometry?.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length < 2) return false;
      const [lng, lat] = coordinates.map(Number);
      return isValidLngLat(lng, lat);
    }),
  );

const buildSelectedBidangFeature = (asset, isBPKAMode) => {
  const ring = normalizePolygonRing(asset?.polygon);
  if (!ring) return null;

  return {
    id: getAssetFeatureId(asset),
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [ring],
    },
    properties: buildBidangPopupFromAsset(asset, isBPKAMode),
  };
};

const getPopupTitle = (layerId, isBPKAMode) => {
  if (layerId === "bidang_tanah_fill") {
    return isBPKAMode ? "Info Objek: BIDANG TANAH" : "Info Objek: BIDANG TANAH";
  }
  if (layerId === "rdtr_fill") {
    return "Info Objek: RDTR (POLA RUANG)";
  }
  if (layerId === "znt_fill") {
    return "Info Objek: ZNT (NILAI TANAH)";
  }
  return "Info Objek";
};

const getPreferredPopupKeys = (layerId, isBPKAMode) => {
  if (layerId === "bidang_tanah_fill") {
    return isBPKAMode
      ? [
          "KODE_ASET",
          "NAMA_ASET",
          "NIB",
          "TIPE HAK",
          "LUAS",
          "PENGGUNAAN",
          "KELURAHAN",
          "KECAMATAN",
          "ATAS_NAMA",
          "OPD_PENGGUNA",
          "KW",
          "KETERANGAN",
        ]
      : [
          "KODE_ASET",
          "NAMA_ASET",
          "STATUS SERTIFIKAT",
          "STATUS",
          "JENIS_MASALAH",
          "NIB",
          "NOMOR HAK",
          "TIPE HAK",
          "LUAS",
          "PENGGUNAAN",
          "KW",
          "PRODUK",
          "KELURAHAN",
          "KECAMATAN",
          "LOKASI",
          "KETERANGAN",
        ];
  }

  if (layerId === "rdtr_fill") {
    return ["RPR", "SUB_RPR", "KETERANGAN"];
  }

  if (layerId === "znt_fill") {
    return ["NILBULAT", "ZONA", "KELAS", "KETERANGAN"];
  }

  return [];
};

const buildBidangPopupFromAsset = (asset, isBPKAMode) => {
  const certificateStatus = normalizeCertificateStatus(
    asset?.status_sertifikat,
    asset?.nomor_sertifikat,
  );

  if (isBPKAMode) {
    return {
      KODE_ASET: asset?.kode_aset || "-",
      NAMA_ASET: asset?.nama_aset || "-",
      NIB: asset?.nib || "-",
      "TIPE HAK": asset?.jenis_hak || "-",
      LUAS: asset?.luas_lapangan || asset?.luas || null,
      PENGGUNAAN: asset?.penggunaan_saat_ini || "-",
      KELURAHAN: asset?.desa_kelurahan || "-",
      KECAMATAN: asset?.kecamatan || "-",
      ATAS_NAMA: asset?.atas_nama || "-",
      OPD_PENGGUNA: asset?.opd_pengguna || "-",
      KW: asset?.kw || "-",
      "STATUS SERTIFIKAT": certificateStatus,
      STATUS_SEWA: asset?.status_sewa || "Tidak Disewakan",
      KETERANGAN: asset?.keterangan || "-",
    };
  }

  return {
    KODE_ASET: asset?.kode_aset || "-",
    NAMA_ASET: asset?.nama_aset || "-",
    "STATUS SERTIFIKAT": certificateStatus,
    STATUS: asset?.status || "-",
    JENIS_MASALAH: asset?.jenis_masalah || "-",
    NIB: asset?.nib || "-",
    "NOMOR HAK": asset?.nomor_sertifikat || "-",
    "TIPE HAK": asset?.jenis_hak || "-",
    LUAS: asset?.luas || null,
    PENGGUNAAN: asset?.penggunaan_saat_ini || "-",
    KW: asset?.kw || "-",
    KELURAHAN: asset?.desa_kelurahan || "-",
    KECAMATAN: asset?.kecamatan || "-",
    LOKASI: asset?.lokasi || "-",
    KETERANGAN: asset?.keterangan || "-",
  };
};

const MapDisplayBPN = ({
  assets = [],
  allAssets = null,
  mode = "bpn",
  initialCenter = DEFAULT_MAP_CENTER,
  initialZoom = DEFAULT_MAP_ZOOM,
  highlightAssetId = null,
  highlightRequestKey = null,
  focus3dRequestKey = null,
  forceDirectModelPreview = false,
  onDetailedModelStatusChange = null,
  initialAsset3dMode = false,
  showAsset3dToolbar = true,
  asset3dPanelContainer = null,
  asset3dPanelOpen,
  asset2dPanelContent = null,
  onAsset3dPanelOpenChange = null,
  onAsset3dModeChange = null,
  onFeatureClick = null,
  onOtherLayerClick = null,
  clearSelectionKey = null,
  // External control props (used when showControls=false)
  activeLayer: activeLayerProp,
  showKelurahan: showKelurahanProp,
  showKecamatan: showKecamatanProp,
  showSudahSertifikat: showSudahSertifikatProp,
  showBelumSertifikat: showBelumSertifikatProp,
  showMarkers: showMarkersProp,
  setShowMarkers: setShowMarkersProp,
  showPolygons: showPolygonsProp,
  setShowPolygons: setShowPolygonsProp,
  showControls = true,
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const cesiumMapRef = useRef(null);
  const popupRef = useRef(null);
  const lastHandledHighlightRef = useRef(null);
  const lastHandledFocus3dRef = useRef(null);
  const lastAutoFocused3dLoadRef = useRef(null);
  const lastClearSelectionKeyRef = useRef(clearSelectionKey);
  const hoveredBidangId = useRef(null);
  const hoveredAsset3dId = useRef(null);
  const selectedBidangId = useRef(null);
  const analysisStateRef = useRef({ tool: null, points: [] });
  const baseLayerVisibilityRef = useRef(new Map());
  const isBPKAMode = mode === "bpka";

  // Internal state (used when showControls=true, i.e. DashboardPage)
  const [activeLayerInternal, setActiveLayerInternal] = useState("bidang");
  const [showKelurahanInternal, setShowKelurahanInternal] = useState(true);
  const [showKecamatanInternal, setShowKecamatanInternal] = useState(true);
  const [showMarkersInternal, setShowMarkersInternal] = useState(false);
  const [showPolygonsInternal, setShowPolygonsInternal] = useState(true);
  const [showSudahSertifikatInternal, setShowSudahSertifikatInternal] =
    useState(true);
  const [showBelumSertifikatInternal, setShowBelumSertifikatInternal] =
    useState(true);
  const [activeBasemap, setActiveBasemap] = useState(MAPLIBRE_BASEMAP_ID);
  const [basemapError, setBasemapError] = useState("");
  const [isBasemapMenuOpen, setIsBasemapMenuOpen] = useState(false);
  const [openMapSetting, setOpenMapSetting] = useState("basemap");
  const [isMapReady, setIsMapReady] = useState(false);
  const [isAsset3dMode, setIsAsset3dMode] = useState(Boolean(initialAsset3dMode));
  const [isAsset3dPanelOpen, setIsAsset3dPanelOpen] = useState(Boolean(initialAsset3dMode));
  const resolvedAsset3dPanelOpen =
    typeof asset3dPanelOpen === "boolean"
      ? asset3dPanelOpen
      : isAsset3dPanelOpen;
  const [visible3dLocationIds, setVisible3dLocationIds] = useState(null);
  const [detailedModelStatus, setDetailedModelStatus] = useState({
    state: "idle",
    loaded: 0,
    total: 0,
    failed: 0,
  });
  const [tileset3dStatus, setTileset3dStatus] = useState({
    state: "idle",
    loaded: 0,
    failed: 0,
  });
  const [analysisTool, setAnalysisTool] = useState(null);
  const [analysisPoints, setAnalysisPoints] = useState([]);
  const [analysisGeometry, setAnalysisGeometry] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    onDetailedModelStatusChange?.(detailedModelStatus);
  }, [detailedModelStatus, onDetailedModelStatusChange]);
  // Resolve: use external props when showControls=false, internal state otherwise
  const activeLayer = showControls
    ? activeLayerInternal
    : (activeLayerProp ?? "bidang");
  const showMarkers = showControls
    ? showMarkersInternal
    : (showMarkersProp ?? true);
  const showPolygons = showControls
    ? showPolygonsInternal
    : (showPolygonsProp ?? false);
  const setShowMarkersResolved = showControls
    ? setShowMarkersInternal
    : (setShowMarkersProp ?? (() => {}));
  const setShowPolygonsResolved = showControls
    ? setShowPolygonsInternal
    : (setShowPolygonsProp ?? (() => {}));
  const showKelurahan = showControls
    ? showKelurahanInternal
    : (showKelurahanProp ?? true);
  const showKecamatan = showControls
    ? showKecamatanInternal
    : (showKecamatanProp ?? true);
  const showSudahSertifikat = showControls
    ? showSudahSertifikatInternal
    : (showSudahSertifikatProp ?? true);
  const showBelumSertifikat = showControls
    ? showBelumSertifikatInternal
    : (showBelumSertifikatProp ?? true);
  // Refs untuk menghindari stale closure di map event handler yang didaftarkan sekali
  const roleAssetsRef = useRef([]);
  const onFeatureClickRef = useRef(onFeatureClick);
  const onOtherLayerClickRef = useRef(onOtherLayerClick);
  const isBPKAModeRef = useRef(isBPKAMode);

  const roleAssets = useMemo(() => {
    return assets || [];
  }, [assets]);
  const model3dLocations = useMemo(
    () => roleAssets.filter(hasUsableAsset3dData).flatMap((asset) => {
      const summary = getAsset3dSummary(asset);
      const assetId = asset?.id_aset || asset?.id;
      const activeModels = Array.isArray(asset?.active_models_3d)
        && asset.active_models_3d.length > 0
        ? asset.active_models_3d
        : asset?.active_model_3d
          ? [asset.active_model_3d]
          : [null];

      return activeModels.map((model, modelIndex) => {
        const rawLatitude = Number(
          model?.location_lat ?? asset?.koordinat_lat ?? asset?.latitude ?? asset?.lat,
        );
        const rawLongitude = Number(
          model?.location_long ?? asset?.koordinat_long ?? asset?.longitude ?? asset?.lng,
        );
        const offsetLocation = resolveModelOffsetLocation({
          ...model,
          location_lat: rawLatitude,
          location_long: rawLongitude,
        });
        const modelId = model?.id_model_3d || null;
        return {
          id: modelId
            ? `model-${modelId}`
            : `asset-${assetId}-${modelIndex}`,
          assetId,
          modelId,
          name: asset?.nama_aset || asset?.nama || asset?.kode_aset || `Aset ${assetId}`,
          location: asset?.lokasi || asset?.desa_kelurahan || "Lokasi belum dilengkapi",
          latitude: offsetLocation.latitude,
          longitude: offsetLocation.longitude,
          lod: model?.lod || summary.lod || "LOD1",
          modelType: model?.model_type || (model?.public_url ? "Model detail" : "Bangunan LOD1"),
          conversionStatus: model?.conversion_status || "ready",
          rooms: Array.isArray(model?.manifest?.rooms) ? model.manifest.rooms : [],
        };
      });
    }),
    [roleAssets],
  );
  const visible3dLocationIdSet = useMemo(
    () => visible3dLocationIds === null
      ? null
      : new Set(visible3dLocationIds.map(String)),
    [visible3dLocationIds],
  );
  const visible3dAssetIdSet = useMemo(
    () => visible3dLocationIdSet === null
      ? null
      : new Set(
          model3dLocations
            .filter((location) => visible3dLocationIdSet.has(String(location.id)))
            .map((location) => String(location.assetId)),
        ),
    [model3dLocations, visible3dLocationIdSet],
  );
  const visible3dAssets = useMemo(
    () => visible3dAssetIdSet === null
      ? roleAssets
      : roleAssets.filter((asset) => visible3dAssetIdSet.has(String(asset?.id_aset || asset?.id))),
    [roleAssets, visible3dAssetIdSet],
  );
  const assetBuildingGeoJson = useMemo(
    () => buildAssetBuildingFeatureCollection(
      visible3dAssets,
      { fallbackOnly: true },
    ),
    [visible3dAssets],
  );
  const detailedModels3d = useMemo(
    () => visible3dAssets
      .flatMap((asset) => {
        const activeModels = Array.isArray(asset?.active_models_3d)
          && asset.active_models_3d.length > 0
          ? asset.active_models_3d
          : asset?.active_model_3d
            ? [asset.active_model_3d]
            : [];
        const assetLongitude = Number(
          asset?.koordinat_long ?? asset?.lng ?? asset?.longitude,
        );
        const assetLatitude = Number(
          asset?.koordinat_lat ?? asset?.lat ?? asset?.latitude,
        );
        const fallbackPoints = getPolygonPoints(
          asset?.polygon || asset?.polygon_bidang || asset?.building_footprint,
        );
        const fallbackLongitude = Number.isFinite(assetLongitude)
          ? assetLongitude
          : fallbackPoints.length > 0
            ? fallbackPoints.reduce((sum, point) => sum + point[0], 0) / fallbackPoints.length
            : null;
        const fallbackLatitude = Number.isFinite(assetLatitude)
          ? assetLatitude
          : fallbackPoints.length > 0
            ? fallbackPoints.reduce((sum, point) => sum + point[1], 0) / fallbackPoints.length
            : null;
        return activeModels.map((model) => ({
          ...model,
          assetId: asset?.id_aset || asset?.id,
          locationId: `model-${model.id_model_3d}`,
          location_lat: model.location_lat ?? fallbackLatitude,
          location_long: model.location_long ?? fallbackLongitude,
        }));
      })
      .filter((model) => (model?.public_url || model?.converted_public_url)
        && (
          visible3dLocationIdSet === null
          || visible3dLocationIdSet.has(String(model.locationId))
        )
        && Number.isFinite(Number(model.location_lat))
        && Number.isFinite(Number(model.location_long))),
    [visible3dAssets, visible3dLocationIdSet],
  );
  const tiledAssetIds = useMemo(
    () => forceDirectModelPreview
      ? []
      : detailedModels3d
      .filter((model) => model.conversion_status === "ready"
        && model.converted_public_url)
      .map((model) => model.assetId)
      .filter(Boolean)
      .filter((assetId, index, values) => values.indexOf(assetId) === index)
      .slice(0, 1000),
    [detailedModels3d, forceDirectModelPreview],
  );
  const fallbackDetailedModels3d = useMemo(
    () => forceDirectModelPreview
      ? detailedModels3d.filter(
          (model) => String(model?.format || model?.model_type || "").toUpperCase() !== "3DTILES",
        )
      : detailedModels3d.filter((model) => tileset3dStatus.state === "error"
        || model.conversion_status !== "ready"
        || !model.converted_public_url),
    [detailedModels3d, forceDirectModelPreview, tileset3dStatus.state],
  );
  // Full asset list for highlight/flyTo lookups (falls back to filtered list)
  const allAssetsResolved = useMemo(
    () => allAssets || assets || [],
    [allAssets, assets],
  );
  const analysisFeatureCollection = useMemo(
    () => buildAnalysisFeatureCollection({
      points: analysisPoints,
      geometry: analysisGeometry,
    }),
    [analysisGeometry, analysisPoints],
  );

  const bidangTanahGeoJson = useMemo(() => {
    const features = roleAssets
      .map((asset, index) => {
        const ring = normalizePolygonRing(asset?.polygon);
        if (!ring) {
          return null;
        }

        return {
          id: getAssetFeatureId(asset),
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [ring],
          },
          properties: {
            ...buildBidangPopupFromAsset(asset, isBPKAMode),
            MARKER_NUMBER: index + 1,
          },
        };
      })
      .filter(Boolean);

    return {
      type: "FeatureCollection",
      features,
    };
  }, [roleAssets, isBPKAMode]);

  // Dot GeoJSON from asset coordinates, with polygon centroid as fallback.
  const dotGeoJson = useMemo(() => {
    const features = roleAssets
      .map((asset, index) => {
        const coordinates = getAssetPointLngLat(asset);
        if (!coordinates) return null;
        return {
          id: getAssetFeatureId(asset) ?? `asset-dot-${index}`,
          type: "Feature",
          geometry: { type: "Point", coordinates },
          properties: {
            ...buildBidangPopupFromAsset(asset, isBPKAMode),
            MARKER_NUMBER: index + 1,
          },
        };
      })
      .filter(Boolean);
    return { type: "FeatureCollection", features };
  }, [roleAssets, isBPKAMode]);

  const visibleDotGeoJson = useMemo(() => {
    return hasVisibleDotCoordinates(dotGeoJson)
      ? dotGeoJson
      : EMPTY_FEATURE_COLLECTION;
  }, [dotGeoJson]);

  // Sync refs setiap kali nilai berubah supaya handler peta selalu punya data terbaru
  useEffect(() => {
    roleAssetsRef.current = roleAssets;
  }, [roleAssets]);

  useEffect(() => {
    analysisStateRef.current = {
      tool: analysisTool,
      points: analysisPoints,
    };
  }, [analysisPoints, analysisTool]);

  useEffect(() => {
    onFeatureClickRef.current = onFeatureClick;
    onOtherLayerClickRef.current = onOtherLayerClick;
    isBPKAModeRef.current = isBPKAMode;
  }, [onFeatureClick, onOtherLayerClick, isBPKAMode]);

  // When both marker & polygon are unchecked, show small dot without labels
  const dotsOnlyMode = !showMarkers && !showPolygons;
  const effectiveShowMarkers = showMarkers || dotsOnlyMode;
  const effectiveShowPolygons = showPolygons;

  const zntCachedData = useRef(null);

  const getBidangSource = () => bidangTanahGeoJson;

  const getBidangLineColor = () => {
    return [
      "match",
      ["get", "STATUS SERTIFIKAT"],
      UNCERTIFIED_STATUS,
      "#dc2626",
      CERTIFIED_STATUS,
      "#0369a1",
      "#6b7280",
    ];
  };

  const getBidangLineWidth = () => {
    return [
      "case",
      [
        "any",
        ["boolean", ["feature-state", "hover"], false],
        ["boolean", ["feature-state", "selected"], false],
      ],
      1.8,
      1,
    ];
  };

  const getCertificateLayerFilter = () => {
    if (showSudahSertifikat && showBelumSertifikat) return null;
    if (!showSudahSertifikat && !showBelumSertifikat) {
      return ["==", ["get", "STATUS SERTIFIKAT"], "__hidden__"];
    }

    return [
      "==",
      ["get", "STATUS SERTIFIKAT"],
      showSudahSertifikat ? CERTIFIED_STATUS : UNCERTIFIED_STATUS,
    ];
  };

  const applyCertificateLayerFilter = () => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const filter = getCertificateLayerFilter();
    [
      "bidang_tanah_fill",
      "bidang_tanah_line",
      "asset-dots-circle",
      "asset-dots-label",
    ].forEach((layerId) => {
      if (map.current.getLayer(layerId)) {
        map.current.setFilter(layerId, filter);
      }
    });
  };

  const formatPopupValue = (key, value) => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    const upKey = String(key).toUpperCase();
    const asNumber = Number(value);
    const isNumericValue = Number.isFinite(asNumber);

    if (isNumericValue) {
      if (
        upKey.includes("NILAI") ||
        upKey.includes("HARGA") ||
        upKey.includes("NILBULAT")
      ) {
        return `Rp ${asNumber.toLocaleString("id-ID")}`;
      }
      if (upKey.includes("LUAS") || upKey.includes("AREA")) {
        return `${asNumber.toLocaleString("id-ID")} m2`;
      }
    }

    return String(value);
  };

  const buildMapPopupHtml = (properties = {}, layerId = "") => {
    const ignored = new Set([
      "layer",
      "source",
      "_NILBULAT_NUM",
      "_calculated_height",
    ]);
    const preferredKeys = getPreferredPopupKeys(layerId, isBPKAMode);
    const availableKeys = Object.keys(properties || {}).filter(
      (key) => !ignored.has(key),
    );

    const orderedKeys = [
      ...preferredKeys.filter((key) => availableKeys.includes(key)),
      ...availableKeys.filter((key) => !preferredKeys.includes(key)),
    ];

    const tbody = orderedKeys
      .map((key) => {
        const label = key.replace(/_/g, " ");
        const formattedValue = formatPopupValue(key, properties[key]);
        return `<tr><td>${label}</td><td>${formattedValue}</td></tr>`;
      })
      .join("");

    const popupTitle = getPopupTitle(layerId, isBPKAMode);

    return `
      <div class="maplibre-popup-content">
        <div class="popup-header">${popupTitle}</div>
        <div class="popup-body">
          <table class="popup-table">
            <tbody>${tbody || "<tr><td>Info</td><td>-</td></tr>"}</tbody>
          </table>
        </div>
      </div>
    `;
  };

  const openMapPopup = (lngLat, properties, layerId = "") => {
    if (!map.current) return;

    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    const popup = new maplibregl.Popup({
      maxWidth: "360px",
      className: "maplibre-custom-popup",
    })
      .setLngLat(lngLat)
      .setHTML(buildMapPopupHtml(properties, layerId))
      .addTo(map.current);

    popup.on("close", () => {
      try {
        if (popupRef.current === popup) {
          popupRef.current = null;
        }
        clearSelectedBidangState();
      } catch {
        // Silently ignore errors when map is being destroyed
      }
    });

    popupRef.current = popup;
  };

  const setSourceFeatureState = useCallback((source, id, state) => {
    if (!map.current || id === null || id === undefined) return;
    if (!map.current.getSource(source)) return;

    try {
      map.current.setFeatureState({ source, id }, state);
    } catch (error) {
      console.warn(`Could not set ${source} feature state:`, error);
    }
  }, []);

  const clearSelectedBidangState = useCallback(() => {
    if (!map.current) {
      selectedBidangId.current = null;
      return;
    }

    if (selectedBidangId.current !== null) {
      setSourceFeatureState("bidang_tanah", selectedBidangId.current, {
        selected: false,
      });
      setSourceFeatureState("asset-dots", selectedBidangId.current, {
        selected: false,
      });
    }
    selectedBidangId.current = null;

    const selectedSource = map.current?.getSource(SELECTED_BIDANG_SOURCE_ID);
    if (selectedSource) {
      selectedSource.setData(EMPTY_FEATURE_COLLECTION);
    }
  }, [setSourceFeatureState]);

  const setSelectedBidangOverlay = (feature) => {
    const selectedSource = map.current?.getSource(SELECTED_BIDANG_SOURCE_ID);
    if (!selectedSource) return;

    selectedSource.setData(
      feature
        ? {
            type: "FeatureCollection",
            features: [
              {
                ...feature,
                properties: feature.properties || {},
              },
            ],
          }
        : EMPTY_FEATURE_COLLECTION,
    );
  };

  const selectBidangAsset = (asset) => {
    const id = getAssetFeatureId(asset);
    clearSelectedBidangState();
    setSelectedBidangOverlay(buildSelectedBidangFeature(asset, isBPKAMode));
    if (id === null) return;

    selectedBidangId.current = id;
    setSourceFeatureState("bidang_tanah", id, { selected: true });
    setSourceFeatureState("asset-dots", id, { selected: true });
  };

  const selectBidangFeature = (feature) => {
    if (feature?.id === null || feature?.id === undefined) return;

    clearSelectedBidangState();
    setSelectedBidangOverlay({
      id: feature.id,
      type: "Feature",
      geometry: feature.geometry,
      properties: feature.properties || {},
    });
    selectedBidangId.current = feature.id;
    setSourceFeatureState("bidang_tanah", feature.id, { selected: true });
  };

  const closeMapPopup = () => {
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
  };

  const findAnalysisAsset = (event, renderedFeatures = []) => {
    const featureAssetId = renderedFeatures.find(
      (feature) => feature.layer?.id === "asset-buildings-3d-layer",
    )?.properties?.id_aset;
    const currentAssets = roleAssetsRef.current;
    if (featureAssetId != null) {
      const matchedAsset = currentAssets.find(
        (asset) =>
          String(asset?.id_aset ?? asset?.id) === String(featureAssetId),
      );
      if (matchedAsset) return matchedAsset;
    }

    const clickedPoint = [event.lngLat.lng, event.lngLat.lat];
    const metersPerPixel =
      (156543.03392 * Math.cos((event.lngLat.lat * Math.PI) / 180)) /
      (2 ** map.current.getZoom());
    const clickTolerance = Math.max(35, metersPerPixel * 36);

    return currentAssets
      .map((asset) => {
        const model = asset?.active_model_3d;
        const rawLongitude = Number(
          model?.location_long ??
            asset?.koordinat_long ??
            asset?.longitude ??
            asset?.lng,
        );
        const rawLatitude = Number(
          model?.location_lat ??
            asset?.koordinat_lat ??
            asset?.latitude ??
            asset?.lat,
        );
        if (!Number.isFinite(rawLongitude) || !Number.isFinite(rawLatitude)) {
          return null;
        }
        const { longitude, latitude } = resolveModelOffsetLocation({
          ...model,
          location_long: rawLongitude,
          location_lat: rawLatitude,
        });
        const radius = Math.max(
          0,
          Number(model?.converted_bounds?.radius) || 0,
        );
        return {
          asset,
          distance: distanceMeters(clickedPoint, [longitude, latitude]),
          tolerance: Math.max(clickTolerance, radius + 20),
        };
      })
      .filter((candidate) => candidate?.distance <= candidate?.tolerance)
      .sort((left, right) => left.distance - right.distance)[0]?.asset;
  };

  const setAnalysisVisualization = ({
    points,
    geometry = null,
    result = null,
  }) => {
    analysisStateRef.current = {
      ...analysisStateRef.current,
      points,
    };
    setAnalysisPoints(points);
    setAnalysisGeometry(geometry);
    setAnalysisResult(result);
  };

  const handleAnalysisClick = (
    event,
    renderedFeatures = [],
    directAsset = null,
  ) => {
    const tool = analysisStateRef.current.tool;
    if (!tool) return false;

    closeMapPopup();
    clearSelectedBidangState();
    const clickedPoint = [event.lngLat.lng, event.lngLat.lat];

    if (tool === "coordinate") {
      setAnalysisVisualization({
        points: [clickedPoint],
        result: {
          status: "success",
          label: "Koordinat titik",
          value: `${event.lngLat.lat.toFixed(7)}, ${event.lngLat.lng.toFixed(7)}`,
          detail: "Format latitude, longitude (WGS 84 / EPSG:4326).",
        },
      });
      return true;
    }

    if (tool === "distance") {
      const nextPoints = [...analysisStateRef.current.points, clickedPoint];
      const totalDistance = lineDistanceMeters(nextPoints);
      setAnalysisVisualization({
        points: nextPoints,
        result: nextPoints.length < 2
          ? {
              status: "success",
              label: "Titik awal dipilih",
              value: "Klik titik berikutnya",
              detail: "Anda dapat menambahkan lebih dari dua titik untuk mengukur rute.",
            }
          : {
              status: "success",
              label: "Total jarak",
              value: formatMetricValue(totalDistance, "m"),
              detail: `${nextPoints.length} titik · ${nextPoints.length - 1} segmen pengukuran`,
            },
      });
      return true;
    }

    const asset = directAsset || findAnalysisAsset(event, renderedFeatures);
    if (!asset) {
      setAnalysisVisualization({
        points: [clickedPoint],
        result: {
          status: "error",
          label: tool === "height" ? "Tinggi belum terbaca" : "Volume belum terbaca",
          value: "Pilih bangunan 3D",
          detail: "Klik tepat pada bangunan atau model 3D yang memiliki metadata ukuran.",
        },
      });
      return true;
    }

    const buildingFeature = buildAssetBuildingFeature(asset);
    const heightData = resolveAssetBuildingHeight(asset);
    const modelBounds = asset?.active_model_3d?.converted_bounds;
    const modelHeight = Number(modelBounds?.size?.[1]);
    const height = heightData?.height ||
      (Number.isFinite(modelHeight) && modelHeight > 0 ? modelHeight : null);
    const assetName =
      asset?.nama_aset || asset?.nama || asset?.kode_aset || "Bangunan 3D";

    if (tool === "height") {
      setAnalysisVisualization({
        points: [clickedPoint],
        geometry: buildingFeature?.geometry || null,
        result: height
          ? {
              status: "success",
              label: `Tinggi · ${assetName}`,
              value: formatMetricValue(height, "m"),
              detail: heightData?.height
                ? `Berdasarkan metadata aset (${heightData.quality || "indikatif"}).`
                : "Estimasi berdasarkan kotak batas model 3D.",
            }
          : {
              status: "error",
              label: "Metadata tinggi belum tersedia",
              value: assetName,
              detail: "Isi tinggi bangunan atau konversi ulang model agar kotak batas dapat dibaca.",
            },
      });
      return true;
    }

    const footprintArea = geometryAreaSquareMeters(buildingFeature?.geometry);
    const boundSizes = Array.isArray(modelBounds?.size)
      ? modelBounds.size.map(Number)
      : [];
    const boundsVolume =
      boundSizes.length === 3 && boundSizes.every((size) => Number.isFinite(size) && size > 0)
        ? boundSizes.reduce((product, size) => product * size, 1)
        : null;
    const volume =
      footprintArea > 0 && height
        ? footprintArea * height
        : boundsVolume;

    setAnalysisVisualization({
      points: [clickedPoint],
      geometry: buildingFeature?.geometry || null,
      result: volume
        ? {
            status: "success",
            label: `Volume · ${assetName}`,
            value: formatMetricValue(volume, "m³"),
            detail: footprintArea > 0 && height
              ? `Tapak ${formatMetricValue(footprintArea, "m²")} × tinggi ${formatMetricValue(height, "m")}.`
              : "Estimasi berdasarkan volume kotak batas model 3D.",
          }
        : {
            status: "error",
            label: "Data volume belum cukup",
            value: assetName,
            detail: "Tambahkan tapak dan tinggi bangunan, atau konversi model dengan metadata kotak batas.",
          },
    });
    return true;
  };

  const handleMapClick = (event) => {
    if (!map.current) return;

    const layersToQuery = [
      "asset-buildings-3d-layer",
      "asset-dots-circle",
      "asset-dots-label",
      "bidang_tanah_fill",
      "rdtr_fill",
      "znt_fill",
    ].filter(
      (layer) =>
        map.current.getLayer(layer) &&
        map.current.getLayoutProperty(layer, "visibility") !== "none",
    );

    const bbox = [
      [event.point.x - 3, event.point.y - 3],
      [event.point.x + 3, event.point.y + 3],
    ];

    const features = map.current.queryRenderedFeatures(bbox, {
      layers: layersToQuery,
    });

    if (handleAnalysisClick(event, features)) return;
    if (!features.length) return;

    const feature = features[0];
    const layerId = feature.layer?.id || "";

    // For bidang tanah layer: try to resolve to a system asset and use custom panel.
    // Matching dilakukan via NIB (field yang ada di GeoJSON dan di kolom nib DB).
    // Fallback ke kode_aset untuk backward compat jika NIB tidak ada.
    // Gunakan refs agar selalu punya data terbaru (avoid stale closure)
    const currentOnFeatureClick = onFeatureClickRef.current;
    const currentOnOtherLayerClick = onOtherLayerClickRef.current;
    const currentRoleAssets = roleAssetsRef.current;

    if (
      (layerId === "bidang_tanah_fill" ||
        layerId === "asset-buildings-3d-layer" ||
        layerId === "asset-dots-circle" ||
        layerId === "asset-dots-label") &&
      currentOnFeatureClick
    ) {
      const nibFromFeature = String(feature.properties?.NIB || "").trim();
      const kodeFromFeature = feature.properties?.KODE_ASET;
      const assetIdFromFeature = feature.properties?.id_aset;

      const matched = currentRoleAssets.find((a) => {
        if (assetIdFromFeature && String(a.id_aset || a.id) === String(assetIdFromFeature)) {
          return true;
        }
        if (nibFromFeature && a.nib) {
          return String(a.nib).trim() === nibFromFeature;
        }
        // fallback: kode_aset untuk polygon yang diinput manual
        if (kodeFromFeature && a.kode_aset) {
          return a.kode_aset === kodeFromFeature;
        }
        return false;
      });

      if (matched) {
        // Bidang aset memakai panel detail dari MapPage; popup peta bawaan
        // ditutup agar tidak muncul ganda.
        closeMapPopup();
        selectBidangAsset(matched);
        currentOnFeatureClick(matched);
        return;
      }
    }

    // Fallback: RDTR / ZNT / unmatched bidang → plain MapLibre popup.
    // Keep the clicked bidang highlighted so the popup source polygon is clear.
    if (layerId === "bidang_tanah_fill") {
      selectBidangFeature(feature);
    } else {
      clearSelectedBidangState();
    }
    if (currentOnOtherLayerClick) currentOnOtherLayerClick();
    openMapPopup(event.lngLat, feature.properties || {}, layerId);
  };

  const handleMouseMove = (event) => {
    if (!map.current) return;
    if (analysisStateRef.current.tool) {
      map.current.getCanvas().style.cursor = "crosshair";
      return;
    }

    const layers = [
      "asset-buildings-3d-layer",
      "asset-dots-circle",
      "asset-dots-label",
      "bidang_tanah_fill",
      "rdtr_fill",
      "znt_fill",
    ].filter(
      (layer) =>
        map.current.getLayer(layer) &&
        map.current.getLayoutProperty(layer, "visibility") !== "none",
    );
    const features = map.current.queryRenderedFeatures(event.point, { layers });
    map.current.getCanvas().style.cursor = features.length ? "pointer" : "";

    if (hoveredAsset3dId.current !== null) {
      map.current.setFeatureState(
        { source: "asset-buildings-3d", id: hoveredAsset3dId.current },
        { hover: false },
      );
      hoveredAsset3dId.current = null;
    }

    const building3dFeature = features.find(
      (feature) => feature.layer?.id === "asset-buildings-3d-layer",
    );
    if (building3dFeature?.id !== undefined) {
      hoveredAsset3dId.current = building3dFeature.id;
      map.current.setFeatureState(
        { source: "asset-buildings-3d", id: hoveredAsset3dId.current },
        { hover: true },
      );
    }

    // Hover highlight for bidang tanah
    if (hoveredBidangId.current !== null) {
      map.current.setFeatureState(
        { source: "bidang_tanah", id: hoveredBidangId.current },
        { hover: false },
      );
      hoveredBidangId.current = null;
    }

    const bidangFeatures = map.current.queryRenderedFeatures(event.point, {
      layers: ["bidang_tanah_fill"].filter((l) => map.current.getLayer(l)),
    });
    if (bidangFeatures.length > 0 && bidangFeatures[0].id !== undefined) {
      hoveredBidangId.current = bidangFeatures[0].id;
      map.current.setFeatureState(
        { source: "bidang_tanah", id: hoveredBidangId.current },
        { hover: true },
      );
    }
  };

  useEffect(() => {
    if (lastClearSelectionKeyRef.current === clearSelectionKey) return;

    lastClearSelectionKeyRef.current = clearSelectionKey;
    clearSelectedBidangState();
    closeMapPopup();
  }, [clearSelectionKey, clearSelectedBidangState]);

  const getHighlightCoords = (asset) => {
    const lat = Number(asset?.koordinat_lat ?? asset?.latitude ?? asset?.lat);
    const lng = Number(asset?.koordinat_long ?? asset?.longitude ?? asset?.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return [lng, lat];
    }

    const validPoints = getPolygonPoints(
      asset?.polygon ?? asset?.polygon_bidang ?? asset?.building_footprint,
    );
    if (validPoints.length > 0) {
      const sum = validPoints.reduce(
        (acc, [pLat, pLng]) => [acc[0] + pLat, acc[1] + pLng],
        [0, 0],
      );
      return [sum[1] / validPoints.length, sum[0] / validPoints.length];
    }

    return null;
  };

  const fitToHighlightedAsset = (asset, lngLat) => {
    if (!map.current) return;

    const ring = normalizePolygonRing(
      asset?.polygon ?? asset?.polygon_bidang ?? asset?.building_footprint,
    );
    if (ring?.length >= 3) {
      const bounds = new maplibregl.LngLatBounds();
      ring.forEach(([lng, lat]) => bounds.extend([lng, lat]));

      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, {
          padding: { top: 36, right: 36, bottom: 36, left: 36 },
          maxZoom: 18,
          duration: 1200,
        });
        return;
      }
    }

    map.current.flyTo({
      center: lngLat,
      zoom: Math.max(map.current.getZoom(), 17),
      duration: 1200,
    });
  };

  const isBaseStyleLayer = (layer) => {
    if (!layer?.source) return false;
    if (layer.id === BASEMAP_RASTER_LAYER_ID) return false;
    return !CUSTOM_OVERLAY_SOURCE_IDS.has(layer.source);
  };

  const captureBaseLayerVisibility = () => {
    if (!map.current?.isStyleLoaded()) return;

    const style = map.current.getStyle();
    style?.layers?.forEach((layer) => {
      if (!isBaseStyleLayer(layer)) return;
      if (!baseLayerVisibilityRef.current.has(layer.id)) {
        baseLayerVisibilityRef.current.set(
          layer.id,
          layer.layout?.visibility || "visible",
        );
      }
    });
  };

  const hideBaseStyleLabels = () => {
    if (!map.current?.isStyleLoaded()) return;

    try {
      const style = map.current.getStyle();
      style?.layers?.forEach((layer) => {
        if (layer.type !== "symbol" || !isBaseStyleLayer(layer)) return;
        map.current.setPaintProperty(layer.id, "text-opacity", 0);
        map.current.setPaintProperty(layer.id, "icon-opacity", 0);
      });
    } catch (error) {
      console.warn("Could not hide base map labels:", error);
    }
  };

  const setBaseStyleVisibility = (visible) => {
    if (!map.current?.isStyleLoaded()) return;

    captureBaseLayerVisibility();

    const style = map.current.getStyle();
    style?.layers?.forEach((layer) => {
      if (!isBaseStyleLayer(layer) || !map.current.getLayer(layer.id)) return;
      const originalVisibility =
        baseLayerVisibilityRef.current.get(layer.id) || "visible";
      map.current.setLayoutProperty(
        layer.id,
        "visibility",
        visible ? originalVisibility : "none",
      );
    });

    if (visible) {
      hideBaseStyleLabels();
    }
  };

  const removeBasemapRaster = () => {
    if (!map.current?.isStyleLoaded()) return;

    if (map.current.getLayer(BASEMAP_RASTER_LAYER_ID)) {
      map.current.removeLayer(BASEMAP_RASTER_LAYER_ID);
    }
    if (map.current.getSource(BASEMAP_RASTER_SOURCE_ID)) {
      map.current.removeSource(BASEMAP_RASTER_SOURCE_ID);
    }
  };

  const applyBasemap = async (basemapId) => {
    if (!map.current?.isStyleLoaded()) return;

    const option =
      BASEMAP_OPTIONS.find((item) => item.id === basemapId) ||
      BASEMAP_OPTIONS[0];
    setBasemapError("");

    if (option.id === MAPLIBRE_BASEMAP_ID) {
      removeBasemapRaster();
      setBaseStyleVisibility(true);
      setActiveBasemap(option.id);
      return;
    }

    try {
      const tiles = option.tiles;

      if (!tiles?.length || !map.current?.isStyleLoaded()) {
        setBasemapError("Basemap belum bisa dimuat.");
        return;
      }

      removeBasemapRaster();
      setBaseStyleVisibility(false);

      map.current.addSource(BASEMAP_RASTER_SOURCE_ID, {
        type: "raster",
        tiles,
        tileSize: option.tileSize || 256,
        maxzoom: option.maxzoom || 22,
        attribution: option.attribution,
      });

      const beforeLayerId = [
        "batas_kecamatan_fill",
        "batas_wilayah_fill",
        "rdtr_fill",
        "znt_fill",
        "bidang_tanah_fill",
        "asset-dots-circle",
      ].find((layerId) => map.current.getLayer(layerId));

      map.current.addLayer(
        {
          id: BASEMAP_RASTER_LAYER_ID,
          type: "raster",
          source: BASEMAP_RASTER_SOURCE_ID,
          paint: { "raster-opacity": 1 },
        },
        beforeLayerId,
      );
      setActiveBasemap(option.id);
    } catch (error) {
      console.warn("Could not switch basemap:", error);
      setBasemapError("Basemap belum bisa dimuat.");
    }
  };

  const addCustomLayers = () => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    // Batas Kelurahan
    // Batas Kecamatan (added FIRST = bottom layer, so kelurahan gets hover priority)
    if (!map.current.getSource("batas_kecamatan")) {
      map.current.addSource("batas_kecamatan", {
        type: "geojson",
        data: "/data/batas_kecamatan.geojson",
        generateId: true,
      });
      const kecFilter = [
        "in",
        "WADMKC",
        "PURWOREJO",
        "GADINGREJO",
        "BUGUL KIDUL",
      ];
      map.current.addLayer({
        id: "batas_kecamatan_fill",
        type: "fill",
        source: "batas_kecamatan",
        filter: kecFilter,
        paint: {
          "fill-color": "#8b5cf6",
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            0.12,
            0.02,
          ],
        },
      });
      map.current.addLayer({
        id: "batas_kecamatan_line",
        type: "line",
        source: "batas_kecamatan",
        filter: kecFilter,
        paint: {
          "line-color": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            "#7c3aed",
            "#6d28d9",
          ],
          "line-width": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            3.5,
            2.5,
          ],
          "line-dasharray": [4, 3],
          "line-opacity": 0.8,
        },
      });
      map.current.addLayer({
        id: "batas_kecamatan_label",
        type: "symbol",
        source: "batas_kecamatan",
        filter: kecFilter,
        layout: {
          "text-field": ["get", "WADMKC"],
          "text-size": 14,
          "text-font": ["Open Sans Bold"],
          "text-transform": "uppercase",
          "text-letter-spacing": 0.05,
          visibility: "visible",
        },
        paint: {
          "text-color": "#5b21b6",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
          "text-opacity": 0.85,
        },
      });

      // Hover tooltip for kecamatan
      let hoveredKecId = null;
      const kecTooltip = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: "boundary-tooltip",
        offset: 15,
      });
      map.current._kecTooltip = kecTooltip;
      map.current.on("mousemove", "batas_kecamatan_fill", (e) => {
        if (e.features.length > 0) {
          // If cursor is also over a kelurahan feature, let kelurahan tooltip take priority
          const kelFeatures = map.current.queryRenderedFeatures(e.point, {
            layers: ["batas_wilayah_fill"],
          });
          if (kelFeatures.length > 0) {
            kecTooltip.remove();
            return;
          }
          if (hoveredKecId !== null) {
            map.current.setFeatureState(
              { source: "batas_kecamatan", id: hoveredKecId },
              { hover: false },
            );
          }
          hoveredKecId = e.features[0].id;
          map.current.setFeatureState(
            { source: "batas_kecamatan", id: hoveredKecId },
            { hover: true },
          );
          map.current.getCanvas().style.cursor = "pointer";
          if (map.current._kelTooltip) map.current._kelTooltip.remove();
          const props = e.features[0].properties;
          kecTooltip
            .setLngLat(e.lngLat)
            .setHTML(
              `<div style="font-family:system-ui;padding:2px 4px">` +
                `<div style="font-weight:700;font-size:14px;color:#5b21b6;text-transform:uppercase;letter-spacing:0.5px">${props.WADMKC || "-"}</div>` +
                `</div>`,
            )
            .addTo(map.current);
        }
      });
      map.current.on("mouseleave", "batas_kecamatan_fill", () => {
        if (hoveredKecId !== null) {
          map.current.setFeatureState(
            { source: "batas_kecamatan", id: hoveredKecId },
            { hover: false },
          );
        }
        hoveredKecId = null;
        map.current.getCanvas().style.cursor = "";
        kecTooltip.remove();
      });
    }

    // Batas Kelurahan (added AFTER kecamatan = on top, gets hover priority)
    if (!map.current.getSource("batas_wilayah")) {
      map.current.addSource("batas_wilayah", {
        type: "geojson",
        data: "/data/batas_wilayah.geojson",
        generateId: true,
      });
      const kelKecFilter = [
        "in",
        "WADMKC",
        "PURWOREJO",
        "GADINGREJO",
        "BUGUL KIDUL",
      ];
      map.current.addLayer({
        id: "batas_wilayah_fill",
        type: "fill",
        source: "batas_wilayah",
        filter: kelKecFilter,
        paint: {
          "fill-color": "#10b981",
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            0.15,
            0.04,
          ],
        },
      });
      map.current.addLayer({
        id: "batas_wilayah_line",
        type: "line",
        source: "batas_wilayah",
        filter: kelKecFilter,
        paint: {
          "line-color": "#10b981",
          "line-width": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            2,
            1,
          ],
          "line-opacity": 0.7,
        },
      });
      map.current.addLayer({
        id: "batas_wilayah_label",
        type: "symbol",
        source: "batas_wilayah",
        filter: kelKecFilter,
        layout: {
          "text-field": ["get", "NAMOBJ"],
          "text-size": 12,
          "text-font": ["Open Sans Semibold"],
          visibility: "visible",
        },
        paint: {
          "text-color": "#047857",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.5,
          "text-opacity": 0.7,
        },
      });

      // Hover tooltip for kelurahan
      let hoveredKelId = null;
      const kelTooltip = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: "boundary-tooltip",
        offset: 15,
      });
      map.current._kelTooltip = kelTooltip;
      map.current.on("mousemove", "batas_wilayah_fill", (e) => {
        if (e.features.length > 0) {
          if (hoveredKelId !== null) {
            map.current.setFeatureState(
              { source: "batas_wilayah", id: hoveredKelId },
              { hover: false },
            );
          }
          hoveredKelId = e.features[0].id;
          map.current.setFeatureState(
            { source: "batas_wilayah", id: hoveredKelId },
            { hover: true },
          );
          map.current.getCanvas().style.cursor = "pointer";
          if (map.current._kecTooltip) map.current._kecTooltip.remove();
          const props = e.features[0].properties;
          kelTooltip
            .setLngLat(e.lngLat)
            .setHTML(
              `<div style="font-family:system-ui;padding:2px 4px">` +
                `<div style="font-weight:700;font-size:13px;color:#047857">${props.NAMOBJ || "-"}</div>` +
                `<div style="font-size:11px;color:#64748b">Kec. ${props.WADMKC || "-"}</div>` +
                `</div>`,
            )
            .addTo(map.current);
        }
      });
      map.current.on("mouseleave", "batas_wilayah_fill", () => {
        if (hoveredKelId !== null) {
          map.current.setFeatureState(
            { source: "batas_wilayah", id: hoveredKelId },
            { hover: false },
          );
        }
        hoveredKelId = null;
        map.current.getCanvas().style.cursor = "";
        kelTooltip.remove();
      });
    }

    if (!map.current.getSource("rdtr")) {
      map.current.addSource("rdtr", {
        type: "geojson",
        data: "/data/rdtr.geojson",
      });
      map.current.addLayer({
        id: "rdtr_fill",
        type: "fill",
        source: "rdtr",
        layout: { visibility: activeLayer === "rdtr" ? "visible" : "none" },
        paint: {
          "fill-color": [
            "match",
            ["get", "RPR"],
            "Kawasan Perumahan",
            "#facc15",
            "Kawasan Perdagangan dan Jasa",
            "#ef4444",
            "Kawasan Peruntukkan Industri",
            "#78716c",
            [
              "Ruang Terbuka Hijau Kota",
              "Kawasan Ekosistem Mangrove",
              "Kawasan Perkebunan",
              "Kawasan Tanaman Pangan",
              "KP2B",
              "Hutan",
              "RTH",
            ],
            "#22c55e",
            [
              "Sungai",
              "Kawasan Sumber Daya Air",
              "Sempadan Sungai",
              "Sempadan Pantai",
            ],
            "#3b82f6",
            [
              "Kawasan Perkantoran",
              "Kawasan Pendidikan",
              "Kawasan Kesehatan",
              "Kawasan Peribadatan",
              "Kawasan Pelayanan Umum",
              "Kawasan Pariwisata",
              "Kawasan Olahraga",
            ],
            "#a855f7",
            "#94a3b8",
          ],
          "fill-opacity": 0.6,
        },
      });
    }

    if (!map.current.getSource("znt") && zntCachedData.current) {
      map.current.addSource("znt", {
        type: "geojson",
        data: zntCachedData.current,
      });
      map.current.addLayer({
        id: "znt_fill",
        type: "fill",
        source: "znt",
        layout: { visibility: activeLayer === "znt" ? "visible" : "none" },
        paint: {
          "fill-color": [
            "interpolate",
            ["linear"],
            ["get", "_NILBULAT_NUM"],
            0,
            "#fef08a",
            1000000,
            "#f97316",
            5000000,
            "#ef4444",
            10000000,
            "#a855f7",
            50000000,
            "#4c1d95",
          ],
          "fill-opacity": 0.7,
        },
      });
    }

    if (!map.current.getSource("bidang_tanah")) {
      map.current.addSource("bidang_tanah", {
        type: "geojson",
        data: getBidangSource(),
        generateId: true,
      });

      map.current.addLayer({
        id: "bidang_tanah_fill",
        type: "fill",
        source: "bidang_tanah",
        layout: { visibility: effectiveShowPolygons ? "visible" : "none" },
        paint: {
          "fill-color": [
            "match",
            ["get", "STATUS SERTIFIKAT"],
            CERTIFIED_STATUS,
            "#0ea5e9",
            UNCERTIFIED_STATUS,
            "#ef4444",
            "#9ca3af",
          ],
          "fill-opacity": [
            "case",
            [
              "any",
              ["boolean", ["feature-state", "hover"], false],
              ["boolean", ["feature-state", "selected"], false],
            ],
            0.45,
            0.15,
          ],
        },
      });

      map.current.addLayer({
        id: "bidang_tanah_line",
        type: "line",
        source: "bidang_tanah",
        layout: { visibility: effectiveShowPolygons ? "visible" : "none" },
        paint: {
          "line-color": getBidangLineColor(),
          "line-width": getBidangLineWidth(),
        },
      });
    }

    if (!map.current.getSource(SELECTED_BIDANG_SOURCE_ID)) {
      map.current.addSource(SELECTED_BIDANG_SOURCE_ID, {
        type: "geojson",
        data: EMPTY_FEATURE_COLLECTION,
      });

      map.current.addLayer({
        id: SELECTED_BIDANG_FILL_LAYER_ID,
        type: "fill",
        source: SELECTED_BIDANG_SOURCE_ID,
        layout: { visibility: effectiveShowPolygons ? "visible" : "none" },
        paint: {
          "fill-color": "#facc15",
          "fill-opacity": 0.36,
        },
      });

      map.current.addLayer({
        id: SELECTED_BIDANG_LINE_LAYER_ID,
        type: "line",
        source: SELECTED_BIDANG_SOURCE_ID,
        layout: { visibility: effectiveShowPolygons ? "visible" : "none" },
        paint: {
          "line-color": "#eab308",
          "line-width": 2,
        },
      });
    }

    // Dot layer for asset centroids
    if (!map.current.getSource("asset-dots")) {
      map.current.addSource("asset-dots", {
        type: "geojson",
        data: visibleDotGeoJson,
      });

      map.current.addLayer({
        id: "asset-dots-circle",
        type: "circle",
        source: "asset-dots",
        layout: {
          visibility: effectiveShowMarkers ? "visible" : "none",
        },
        paint: {
          "circle-radius": dotsOnlyMode
            ? ["interpolate", ["linear"], ["zoom"], 11, 3, 15, 4, 18, 5]
            : [
                "interpolate",
                ["linear"],
                ["zoom"],
                11,
                5,
                15,
                7,
                18,
                9,
              ],
          "circle-color": [
            "match",
            ["get", "STATUS SERTIFIKAT"],
            CERTIFIED_STATUS,
            "#0ea5e9",
            UNCERTIFIED_STATUS,
            "#ef4444",
            "#9ca3af",
          ],
          "circle-stroke-color": [
            "match",
            ["get", "STATUS SERTIFIKAT"],
            CERTIFIED_STATUS,
            "#0369a1",
            UNCERTIFIED_STATUS,
            "#b91c1c",
            "#6b7280",
          ],
          "circle-stroke-width": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            4,
            1.5,
          ],
          "circle-opacity": 0.85,
        },
      });

      map.current.addLayer({
        id: "asset-dots-label",
        type: "symbol",
        source: "asset-dots",
        layout: {
          visibility:
            showMarkers && !dotsOnlyMode ? "visible" : "none",
          "text-field": ["to-string", ["get", "MARKER_NUMBER"]],
          "text-size": ["interpolate", ["linear"], ["zoom"], 15, 8, 18, 9],
          "text-font": ["Open Sans Bold"],
          "text-allow-overlap": true,
          "text-ignore-placement": true,
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "rgba(15, 23, 42, 0.35)",
          "text-halo-width": 0.35,
          "text-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            14.6,
            0,
            15.2,
            1,
          ],
        },
      });
    }

    if (!map.current.getSource("asset-buildings-3d")) {
      map.current.addSource("asset-buildings-3d", {
        type: "geojson",
        data: assetBuildingGeoJson,
      });
      map.current.addLayer({
        id: "asset-buildings-3d-layer",
        type: "fill-extrusion",
        source: "asset-buildings-3d",
        layout: { visibility: isAsset3dMode ? "visible" : "none" },
        paint: {
          "fill-extrusion-color": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            "#22d3ee",
            [
              "match", ["get", "height_quality"],
              "measured", "#7c3aed",
              "derived", "#2563eb",
              "#d97706",
            ],
          ],
          "fill-extrusion-height": ["coalesce", ["get", "height_m"], 0],
          "fill-extrusion-base": 0,
          // MapLibre only accepts a constant value for extrusion opacity.
          // Hover feedback stays data-driven through fill-extrusion-color.
          "fill-extrusion-opacity": 0.94,
          "fill-extrusion-vertical-gradient": true,
          "fill-extrusion-color-transition": { duration: 120, delay: 0 },
        },
      });
    }

    if (!map.current.getSource(ANALYSIS_SOURCE_ID)) {
      map.current.addSource(ANALYSIS_SOURCE_ID, {
        type: "geojson",
        data: EMPTY_FEATURE_COLLECTION,
      });
      map.current.addLayer({
        id: ANALYSIS_FILL_LAYER_ID,
        type: "fill",
        source: ANALYSIS_SOURCE_ID,
        filter: ["==", ["get", "kind"], "selection"],
        paint: {
          "fill-color": "#22d3ee",
          "fill-opacity": 0.22,
        },
      });
      map.current.addLayer({
        id: ANALYSIS_LINE_LAYER_ID,
        type: "line",
        source: ANALYSIS_SOURCE_ID,
        filter: [
          "match",
          ["get", "kind"],
          ["line", "selection"],
          true,
          false,
        ],
        paint: {
          "line-color": "#7c3aed",
          "line-width": 4,
          "line-opacity": 0.95,
          "line-dasharray": [1.5, 1],
        },
      });
      map.current.addLayer({
        id: ANALYSIS_POINT_LAYER_ID,
        type: "circle",
        source: ANALYSIS_SOURCE_ID,
        filter: ["==", ["get", "kind"], "point"],
        paint: {
          "circle-radius": 7,
          "circle-color": "#7c3aed",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 3,
        },
      });
      map.current.addLayer({
        id: ANALYSIS_LABEL_LAYER_ID,
        type: "symbol",
        source: ANALYSIS_SOURCE_ID,
        filter: ["==", ["get", "kind"], "point"],
        layout: {
          "text-field": ["to-string", ["get", "sequence"]],
          "text-size": 10,
          "text-font": ["Open Sans Bold"],
          "text-allow-overlap": true,
          "text-ignore-placement": true,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });
    }

    applyCertificateLayerFilter();

  };

  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAPLIBRE_STYLE_URL,
      center: initialCenter,
      zoom: initialZoom,
      pitch: 0,
      bearing: 0,
      canvasContextAttributes: {
        antialias: true,
      },
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");
    map.current.addControl(
      new maplibregl.ScaleControl({ maxWidth: 140, unit: "metric" }),
      "bottom-left",
    );

    fetch("/data/znt.geojson")
      .then((res) => res.json())
      .then((data) => {
        data.features.forEach((feature) => {
          if (!feature.properties) feature.properties = {};
          feature.properties._NILBULAT_NUM = 0;
          if (feature.properties.NILBULAT) {
            const cleanStr = String(feature.properties.NILBULAT).replace(
              /[^0-9]/g,
              "",
            );
            if (cleanStr) {
              feature.properties._NILBULAT_NUM = Number(cleanStr);
            }
          }
        });

        zntCachedData.current = data;
        if (map.current?.isStyleLoaded()) {
          addCustomLayers();
        }
      })
      .catch((error) => console.warn("Could not load ZNT:", error));

    map.current.on("load", () => {
      captureBaseLayerVisibility();
      addCustomLayers();
      hideBaseStyleLabels();
      setIsMapReady(true);

      if (map.current?.setLight) {
        map.current.setLight({
          anchor: "viewport",
          color: "white",
          intensity: 0.45,
          position: [1.15, 210, 30],
        });
      }
    });

    map.current.on("click", handleMapClick);
    map.current.on("mousemove", handleMouseMove);

    return () => {
      // Remove popup FIRST before map to prevent race condition
      if (popupRef.current) {
        popupRef.current.off("close"); // Detach close listener to avoid calling it during destruction
        popupRef.current.remove();
        popupRef.current = null;
      }

      // Clean up tooltips to prevent memory leaks
      if (map.current?._kecTooltip) {
        map.current._kecTooltip.remove();
        map.current._kecTooltip = null;
      }
      if (map.current?._kelTooltip) {
        map.current._kelTooltip.remove();
        map.current._kelTooltip = null;
      }

      if (map.current) {
        map.current.off("click", handleMapClick);
        map.current.off("mousemove", handleMouseMove);
        map.current.remove();
        map.current = null;
      }
    };
  // Map listeners are intentionally bound once and read current state from refs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isMapReady || !map.current || !map.current.isStyleLoaded()) return;

    const bidangSource = map.current.getSource("bidang_tanah");
    if (bidangSource) {
      bidangSource.setData(getBidangSource());
      if (selectedBidangId.current !== null) {
        setSourceFeatureState("bidang_tanah", selectedBidangId.current, {
          selected: true,
        });
      }
    }

    // Bidang polygon and marker layers are controlled independently.
    const showPolygon = effectiveShowPolygons;
    if (map.current.getLayer("bidang_tanah_fill")) {
      map.current.setLayoutProperty(
        "bidang_tanah_fill",
        "visibility",
        showPolygon ? "visible" : "none",
      );
    }

    if (map.current.getLayer("bidang_tanah_line")) {
      map.current.setLayoutProperty(
        "bidang_tanah_line",
        "visibility",
        showPolygon ? "visible" : "none",
      );
      map.current.setPaintProperty(
        "bidang_tanah_line",
        "line-color",
        getBidangLineColor(),
      );
      map.current.setPaintProperty(
        "bidang_tanah_line",
        "line-width",
        getBidangLineWidth(),
      );
    }

    [SELECTED_BIDANG_FILL_LAYER_ID, SELECTED_BIDANG_LINE_LAYER_ID].forEach(
      (layerId) => {
        if (map.current.getLayer(layerId)) {
          map.current.setLayoutProperty(
            layerId,
            "visibility",
            showPolygon ? "visible" : "none",
          );
        }
      },
    );

    if (map.current.getLayer("rdtr_fill")) {
      map.current.setLayoutProperty(
        "rdtr_fill",
        "visibility",
        activeLayer === "rdtr" ? "visible" : "none",
      );
    }

    if (map.current.getLayer("znt_fill")) {
      map.current.setLayoutProperty(
        "znt_fill",
        "visibility",
        activeLayer === "znt" ? "visible" : "none",
      );
    }
    // Dot layer: circle visible when marker or dots-only mode
    if (map.current.getLayer("asset-dots-circle")) {
      map.current.setLayoutProperty(
        "asset-dots-circle",
        "visibility",
        effectiveShowMarkers ? "visible" : "none",
      );
      map.current.setPaintProperty("asset-dots-circle", "circle-radius",
        dotsOnlyMode
          ? ["interpolate", ["linear"], ["zoom"], 11, 3, 15, 4, 18, 5]
          : [
              "interpolate", ["linear"], ["zoom"],
              11, 5, 15, 7, 18, 9,
            ],
      );
    }

    // Label layer: only visible when full markers are enabled (not dots-only)
    if (map.current.getLayer("asset-dots-label")) {
      map.current.setLayoutProperty(
        "asset-dots-label",
        "visibility",
        showMarkers && !dotsOnlyMode ? "visible" : "none",
      );
    }

    // Update dot data
    const dotSource = map.current.getSource("asset-dots");
    if (dotSource) {
      dotSource.setData(visibleDotGeoJson);
      if (selectedBidangId.current !== null) {
        setSourceFeatureState("asset-dots", selectedBidangId.current, {
          selected: true,
        });
      }
    }

    const assetBuildingSource = map.current.getSource("asset-buildings-3d");
    if (assetBuildingSource) assetBuildingSource.setData(assetBuildingGeoJson);
    if (map.current.getLayer("asset-buildings-3d-layer")) {
      map.current.setLayoutProperty(
        "asset-buildings-3d-layer",
        "visibility",
        isAsset3dMode ? "visible" : "none",
      );
    }

    // Boundary layer visibility
    const kelVis = showKelurahan ? "visible" : "none";
    if (map.current.getLayer("batas_wilayah_fill"))
      map.current.setLayoutProperty("batas_wilayah_fill", "visibility", kelVis);
    if (map.current.getLayer("batas_wilayah_line"))
      map.current.setLayoutProperty("batas_wilayah_line", "visibility", kelVis);
    if (map.current.getLayer("batas_wilayah_label"))
      map.current.setLayoutProperty(
        "batas_wilayah_label",
        "visibility",
        kelVis,
      );

    const kecVis = showKecamatan ? "visible" : "none";
    if (map.current.getLayer("batas_kecamatan_fill"))
      map.current.setLayoutProperty(
        "batas_kecamatan_fill",
        "visibility",
        kecVis,
      );
    if (map.current.getLayer("batas_kecamatan_line"))
      map.current.setLayoutProperty(
        "batas_kecamatan_line",
        "visibility",
        kecVis,
      );
    if (map.current.getLayer("batas_kecamatan_label"))
      map.current.setLayoutProperty(
        "batas_kecamatan_label",
        "visibility",
        kecVis,
      );

  // Layer synchronization is driven by the data/visibility values below.
  // Helper identities are intentionally excluded to avoid full map reprocessing.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeLayer,
    isBPKAMode,
    bidangTanahGeoJson,
    effectiveShowMarkers,
    effectiveShowPolygons,
    dotsOnlyMode,
    visibleDotGeoJson,
    showKelurahan,
    showKecamatan,
    assetBuildingGeoJson,
    isAsset3dMode,
    isMapReady,
  ]);

  useEffect(() => {
    if (!map.current || !isMapReady || !map.current.isStyleLoaded()) return;
    const analysisSource = map.current.getSource(ANALYSIS_SOURCE_ID);
    if (analysisSource) {
      analysisSource.setData(analysisFeatureCollection);
    }
    map.current.getCanvas().style.cursor = analysisTool ? "crosshair" : "";
  }, [analysisFeatureCollection, analysisTool, isMapReady]);

  useEffect(() => {
    if (!map.current || !isMapReady) return;
    map.current.easeTo({
      pitch: isAsset3dMode ? 60 : 0,
      bearing: isAsset3dMode ? 25 : 0,
      duration: 700,
    });
  }, [isAsset3dMode, isMapReady]);

  useEffect(() => {
    if (!map.current || !isMapReady || !map.current.isStyleLoaded()) return;
    if (map.current.getLayer(DETAILED_MODEL_LAYER_ID)) {
      map.current.removeLayer(DETAILED_MODEL_LAYER_ID);
    }
    setTileset3dStatus({ state: "idle", loaded: 0, failed: 0 });
  }, [isAsset3dMode, isMapReady]);

  // Sertifikat filter
  useEffect(() => {
    applyCertificateLayerFilter();
    // The filter helper reads the current map ref and is triggered by these flags.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSudahSertifikat, showBelumSertifikat, isBPKAMode]);

  useEffect(() => {
    if (!highlightAssetId || !map.current || !allAssetsResolved.length) {
      return;
    }

    const targetAsset = allAssetsResolved.find(
      (asset) => String(asset?.id ?? asset?.id_aset) === String(highlightAssetId),
    );
    if (!targetAsset) {
      return;
    }

    const requestToken = `${highlightRequestKey || "default"}:${highlightAssetId}`;
    if (lastHandledHighlightRef.current === requestToken) {
      return;
    }

    const lngLat = getHighlightCoords(targetAsset);
    if (!lngLat) {
      return;
    }

    const openHighlightedPopup = () => {
      if (!map.current || !map.current.isStyleLoaded()) return;

      selectBidangAsset(targetAsset);
      fitToHighlightedAsset(targetAsset, lngLat);

      if (onFeatureClick) {
        onFeatureClick(targetAsset);
      } else {
        openMapPopup(
          lngLat,
          buildBidangPopupFromAsset(targetAsset, isBPKAMode),
          "bidang_tanah_fill",
        );
      }
      lastHandledHighlightRef.current = requestToken;
    };

    const timeoutId = setTimeout(openHighlightedPopup, 250);
    return () => clearTimeout(timeoutId);
  // Highlight handling is keyed by the public request inputs below.
  // Popup helpers read current map refs and must not retrigger the request.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    allAssetsResolved,
    highlightAssetId,
    highlightRequestKey,
    isBPKAMode,
    onFeatureClick,
  ]);

  const set3dCamera = (options) => {
    if (!map.current) return;
    map.current.easeTo({ duration: 650, ...options });
  };

  const clearAnalysis = () => {
    analysisStateRef.current = { tool: null, points: [] };
    setAnalysisTool(null);
    setAnalysisPoints([]);
    setAnalysisGeometry(null);
    setAnalysisResult(null);
  };

  const changeAnalysisTool = (tool) => {
    analysisStateRef.current = { tool, points: [] };
    setAnalysisTool(tool);
    setAnalysisPoints([]);
    setAnalysisGeometry(null);
    setAnalysisResult(null);
    closeMapPopup();
    clearSelectedBidangState();
  };

  const disableAsset3dMode = () => {
    const keepExternalPanelOpen = Boolean(asset3dPanelContainer);
    clearAnalysis();
    setIsAsset3dMode(false);
    setIsAsset3dPanelOpen(keepExternalPanelOpen);
    onAsset3dModeChange?.(false);
    onAsset3dPanelOpenChange?.(keepExternalPanelOpen);
    set3dCamera({ pitch: 0, bearing: 0 });
  };

  const focusDetailedModel = useCallback((location = null) => {
    if (isAsset3dMode && cesiumMapRef.current) {
      return cesiumMapRef.current.focus(location);
    }
    if (!map.current) return false;
    const model = detailedModels3d[0];
    const fallbackAsset = roleAssets[0];
    const fallbackLongitude = Number(
      fallbackAsset?.koordinat_long ?? fallbackAsset?.lng ?? fallbackAsset?.longitude,
    );
    const fallbackLatitude = Number(
      fallbackAsset?.koordinat_lat ?? fallbackAsset?.lat ?? fallbackAsset?.latitude,
    );
    const fallbackPoints = getPolygonPoints(
      fallbackAsset?.polygon || fallbackAsset?.polygon_bidang || fallbackAsset?.building_footprint,
    );
    const fallbackCoords = Number.isFinite(fallbackLongitude) && Number.isFinite(fallbackLatitude)
      ? [fallbackLongitude, fallbackLatitude]
      : fallbackPoints.length > 0
        ? [
            fallbackPoints.reduce((sum, [, lng]) => sum + lng, 0) / fallbackPoints.length,
            fallbackPoints.reduce((sum, [lat]) => sum + lat, 0) / fallbackPoints.length,
          ]
        : null;
    const modelLocation = model
      ? resolveModelOffsetLocation(model)
      : null;
    const longitude = Number(
      location?.longitude ?? modelLocation?.longitude ?? fallbackCoords?.[0],
    );
    const latitude = Number(
      location?.latitude ?? modelLocation?.latitude ?? fallbackCoords?.[1],
    );
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return false;
    const targetZoom = getModelFocusZoom(model);
    map.current.flyTo({
      center: [longitude, latitude],
      zoom: targetZoom,
      pitch: 60,
      bearing: 25,
      duration: 1200,
      essential: true,
    });
    return true;
  }, [detailedModels3d, isAsset3dMode, roleAssets]);

  useEffect(() => {
    if (focus3dRequestKey == null || !map.current || !isMapReady) return;

    const requestToken = String(focus3dRequestKey);
    if (lastHandledFocus3dRef.current === requestToken) return;

    const focusModel = () => {
      if (focusDetailedModel()) {
        lastHandledFocus3dRef.current = requestToken;
      }
    };

    if (map.current.isStyleLoaded()) {
      focusModel();
      return;
    }

    map.current.once("load", focusModel);
    return () => map.current?.off("load", focusModel);
  }, [focus3dRequestKey, focusDetailedModel, isMapReady]);

  useEffect(() => {
    if (
      !forceDirectModelPreview
      || detailedModelStatus.state !== "ready"
      || detailedModelStatus.loaded < 1
      || fallbackDetailedModels3d.length === 0
    ) {
      return undefined;
    }

    const loadKey = fallbackDetailedModels3d
      .map((model) => [
        model.id_model_3d,
        model.offset_x_m,
        model.offset_y_m,
        model.offset_z_m,
      ].join(":"))
      .join("|");
    if (lastAutoFocused3dLoadRef.current === loadKey) return undefined;

    const timeoutId = setTimeout(() => {
      if (focusDetailedModel()) {
        lastAutoFocused3dLoadRef.current = loadKey;
      }
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [
    detailedModelStatus.loaded,
    detailedModelStatus.state,
    fallbackDetailedModels3d,
    focusDetailedModel,
    forceDirectModelPreview,
  ]);

  const asset3dControlPanel = (
    <Model3dControlPanel
      embedded={Boolean(asset3dPanelContainer)}
      onClose={() => {
        setIsAsset3dPanelOpen(false);
        onAsset3dPanelOpenChange?.(false);
      }}
      onDisable3d={disableAsset3dMode}
      data2dContent={asset2dPanelContent}
      buildingCount={assetBuildingGeoJson.features.length}
      detailedModelCount={detailedModels3d.length}
      tiledModelCount={tiledAssetIds.length}
      fallbackCount={fallbackDetailedModels3d.length}
      tilesetStatus={tileset3dStatus}
      fallbackStatus={detailedModelStatus}
      locations={model3dLocations}
      visibleLocationIds={visible3dLocationIds}
      onVisibleLocationIdsChange={setVisible3dLocationIds}
      showMarkers={showMarkers}
      onShowMarkersChange={setShowMarkersResolved}
      showPolygons={showPolygons}
      onShowPolygonsChange={setShowPolygonsResolved}
      onPerspective={() =>
        cesiumMapRef.current?.setView("perspective")}
      onTopView={() => cesiumMapRef.current?.setView("top")}
      onNorthView={() => cesiumMapRef.current?.setView("north")}
      onFocusModels={focusDetailedModel}
      analysisTool={analysisTool}
      analysisResult={analysisResult}
      analysisPointCount={analysisPoints.length}
      onAnalysisToolChange={changeAnalysisTool}
      onClearAnalysis={clearAnalysis}
    />
  );

  const basemapSwitcher = (
    <div className="absolute right-4 top-4 z-20 flex flex-col items-end sm:right-16">
      <div className="flex items-center gap-2">
        {showAsset3dToolbar && (
          <button
            type="button"
            onClick={() => {
              setIsBasemapMenuOpen(false);
              if (!isAsset3dMode) {
                setIsAsset3dMode(true);
                setIsAsset3dPanelOpen(true);
                onAsset3dModeChange?.(true);
                onAsset3dPanelOpenChange?.(true);
              } else {
                disableAsset3dMode();
              }
            }}
            className={`relative flex h-10 w-10 items-center justify-center rounded-lg border backdrop-blur-sm transition-colors focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${
              isAsset3dMode
                ? "border-violet-600 bg-gradient-to-br from-violet-600 to-sky-500 text-white"
                : "border-white/80 bg-white/95 text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200 dark:hover:bg-slate-800"
            }`}
            title={isAsset3dMode ? "Kembali ke mode 2D" : "Aktifkan mode 3D"}
            aria-label={isAsset3dMode ? "Nonaktifkan mode 3D dan kembali ke mode 2D" : "Aktifkan mode 3D"}
            aria-pressed={isAsset3dMode}
            aria-expanded={isAsset3dMode && resolvedAsset3dPanelOpen}
          >
            <BuildingsIcon size={18} weight="fill" />
            {isAsset3dMode && (
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
            )}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setIsBasemapMenuOpen((value) => !value);
          }}
          className={`relative flex h-10 w-10 items-center justify-center rounded-lg border backdrop-blur-sm transition-colors ${
            isBasemapMenuOpen
              ? "border-accent bg-accent/10 text-accent dark:border-sky-400 dark:bg-sky-500 dark:text-white"
              : "border-white/80 bg-white/95 text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200 dark:hover:bg-slate-800"
          }`}
          title="Layer peta"
          aria-label="Layer peta"
          aria-expanded={isBasemapMenuOpen}
        >
          <StackIcon size={18} weight="fill" />
          {!isBasemapMenuOpen && (
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
          )}
        </button>
      </div>

      {isAsset3dMode
        && resolvedAsset3dPanelOpen
        && showAsset3dToolbar
        && !onAsset3dPanelOpenChange
        && asset3dControlPanel}

      {isBasemapMenuOpen && (
        <div className="mt-1.5 w-[min(19rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-surface/95 shadow-xl shadow-black/15 backdrop-blur-xl">
          <div className="flex h-11 items-center justify-between border-b border-border bg-surface px-3">
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-text-primary">
              <StackIcon size={14} weight="fill" />
              Pengaturan Peta
            </span>
            <button
              type="button"
              onClick={() => setIsBasemapMenuOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition hover:bg-surface-secondary hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Tutup pengaturan peta"
            >
              <XIcon size={13} weight="bold" />
            </button>
          </div>
          <div className="max-h-[calc(100vh-7rem)] overflow-y-auto dark:[color-scheme:dark]">
            <section className="border-b border-border">
              <button
                type="button"
                onClick={() => setOpenMapSetting((value) => value === "basemap" ? null : "basemap")}
                aria-expanded={openMapSetting === "basemap"}
                className={`flex min-h-11 w-full items-center justify-between px-3.5 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.12em] transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                  openMapSetting === "basemap"
                    ? "bg-accent text-surface"
                    : "bg-surface text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                }`}
              >
                <span>Basemap Layer</span>
                <CaretDownIcon size={13} weight="bold" className={`transition-transform ${openMapSetting === "basemap" ? "rotate-180" : ""}`} />
              </button>
              {openMapSetting === "basemap" && <div className="border-t border-border bg-surface-secondary/80 p-3">
                {isAsset3dMode ? (
                <div className="flex h-10 items-center gap-2 rounded-lg border border-violet-300 bg-violet-50 px-2.5 text-violet-800 dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-200">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-600 text-white">
                    <BuildingsIcon size={13} weight="fill" />
                  </span>
                  <span className="min-w-0 flex-1 text-[9px] font-bold">
                    Cesium + OpenStreetMap
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </div>
              ) : (
                <div
                  className="grid grid-cols-2 gap-1.5"
                  role="radiogroup"
                  aria-label="Peta dasar"
                >
                  {BASEMAP_OPTIONS.map((option) => {
                    const isActive = activeBasemap === option.id;
                    const OptionIcon =
                      option.id === "foto_udara" ? ImageIcon : MapTrifoldIcon;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        onClick={() => applyBasemap(option.id)}
                        className={`flex h-9 items-center gap-1.5 rounded-lg border px-2 text-left transition-all hover:border-slate-300 ${
                          isActive
                            ? "border-accent bg-accent/5 ring-2 ring-accent/10 dark:border-sky-500 dark:bg-sky-500/10 dark:ring-sky-500/15"
                            : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                        }`}
                        title={option.label}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                            isActive
                              ? "bg-accent/10 text-accent dark:bg-sky-500 dark:text-white"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          <OptionIcon size={13} weight="fill" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[9px] font-bold text-slate-800 dark:text-slate-100">
                          {option.label}
                        </span>
                        {isActive && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent dark:bg-sky-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
                )}
              {basemapError && (
                <div
                  className="mt-2 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-[10px] font-medium text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                  role="alert"
                >
                  {basemapError}
                </div>
              )}
              </div>}
            </section>

            <section
              className="border-b border-border"
            >
              <button
                type="button"
                onClick={() => setOpenMapSetting((value) => value === "layers" ? null : "layers")}
                aria-expanded={openMapSetting === "layers"}
                className={`flex min-h-11 w-full items-center justify-between px-3.5 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.12em] transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                  openMapSetting === "layers"
                    ? "bg-accent text-surface"
                    : "bg-surface text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                }`}
              >
                <span>Layer Controls</span>
                <CaretDownIcon size={13} weight="bold" className={`transition-transform ${openMapSetting === "layers" ? "rotate-180" : ""}`} />
              </button>
              {openMapSetting === "layers" && <div className="grid grid-cols-2 gap-1.5 border-t border-border bg-surface-secondary/80 p-3">
                <LayerSwitch
                  checked={showMarkers}
                  onChange={setShowMarkersResolved}
                  icon={MapPinIcon}
                  label="Marker"
                  tone="sky"
                  iconClass="bg-sky-50 text-sky-600 dark:bg-sky-500 dark:text-white"
                />
                <LayerSwitch
                  checked={showPolygons}
                  onChange={setShowPolygonsResolved}
                  icon={PolygonIcon}
                  label="Polygon"
                  tone="violet"
                  iconClass="bg-violet-50 text-violet-600 dark:bg-violet-500 dark:text-white"
                />
              </div>}
            </section>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="digital-twin-map relative h-full w-full bg-gray-100 dark:bg-slate-950">
      <div
        ref={mapContainer}
        className={`h-full w-full ${isAsset3dMode ? "invisible absolute inset-0" : ""}`}
      />
      {isAsset3dMode && (
        <div className="absolute inset-0">
          <CesiumAssetMap
            ref={cesiumMapRef}
            assets={visible3dAssets}
            buildingGeoJson={assetBuildingGeoJson}
            polygonGeoJson={bidangTanahGeoJson}
            pointGeoJson={visibleDotGeoJson}
            detailedModels={detailedModels3d}
            showMarkers={effectiveShowMarkers}
            showPolygons={effectiveShowPolygons}
            onFeatureClick={onFeatureClick}
            onOtherLayerClick={onOtherLayerClick}
            onStatusChange={setDetailedModelStatus}
            analysisTool={analysisTool}
            analysisPoints={analysisPoints}
            onAnalysisClick={({ longitude, latitude, asset }) => {
              handleAnalysisClick(
                { lngLat: { lng: longitude, lat: latitude } },
                [],
                asset,
              );
            }}
          />
        </div>
      )}
      {basemapSwitcher}
      {isAsset3dMode
        && resolvedAsset3dPanelOpen
        && showAsset3dToolbar
        && asset3dPanelContainer
        && createPortal(asset3dControlPanel, asset3dPanelContainer)}

      {/* Internal controls – rendered only when showControls=true (e.g. DashboardPage) */}
      {showControls && (
        <>
          <div className="absolute top-4 left-4 z-20 w-60">
            <BPNLayerControl
              activeLayer={activeLayer}
              setActiveLayer={setActiveLayerInternal}
              panelTitle={isBPKAMode ? "Kontrol Layer" : "Kontrol Layer"}
              bidangLabel={isBPKAMode ? "Bidang Tanah" : "Bidang Tanah"}
              showKelurahan={showKelurahan}
              setShowKelurahan={setShowKelurahanInternal}
              showKecamatan={showKecamatan}
              setShowKecamatan={setShowKecamatanInternal}
              isBPKAMode={isBPKAMode}
              showSudahSertifikat={showSudahSertifikat}
              setShowSudahSertifikat={setShowSudahSertifikatInternal}
              showBelumSertifikat={showBelumSertifikat}
              setShowBelumSertifikat={setShowBelumSertifikatInternal}
            />
          </div>

        </>
      )}
    </div>
  );
};

export default MapDisplayBPN;
