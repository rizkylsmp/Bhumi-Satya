import { normalizePolygonToGeometry } from "./geojsonExport";

export const HEIGHT_QUALITY_CONFIG = {
  measured: { label: "Terukur", color: "#7c3aed" },
  derived: { label: "Hasil Turunan", color: "#2563eb" },
  estimated: { label: "Estimasi", color: "#d97706" },
};

const positiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const resolveAssetBuildingHeight = (asset = {}) => {
  const height = positiveNumber(asset.building_height_m);
  const source = asset.building_height_source || "other";
  if (height) {
    const inferredQuality = ["survey", "lidar"].includes(source)
      ? "measured"
      : ["photogrammetry", "document"].includes(source)
        ? "derived"
        : "estimated";
    return {
      height,
      source,
      quality: asset.building_height_quality || inferredQuality,
    };
  }

  const floors = positiveNumber(asset.building_floors);
  return floors
    ? { height: floors * 3.5, source: "floor_estimate", quality: "estimated" }
    : null;
};

const getActiveModels = (asset) => {
  if (Array.isArray(asset?.active_models_3d) && asset.active_models_3d.length) {
    return asset.active_models_3d;
  }
  return asset?.active_model_3d ? [asset.active_model_3d] : [];
};

const hasDetailedModel = (asset) =>
  getActiveModels(asset).some(
    (model) => model?.converted_public_url || model?.public_url,
  );

export const hasUsableAsset3dData = (asset) =>
  hasDetailedModel(asset) || (
    Boolean(normalizePolygonToGeometry(asset?.building_footprint)) &&
    Boolean(resolveAssetBuildingHeight(asset))
  );

export const getAsset3dSummary = (asset = {}) => {
  const heightData = resolveAssetBuildingHeight(asset);
  return {
    available: hasUsableAsset3dData(asset),
    detailedModelAvailable: hasDetailedModel(asset),
    height: heightData?.height || null,
    source: heightData?.source || asset.building_height_source || null,
    quality: heightData?.quality || asset.building_height_quality || null,
    qualityLabel: heightData?.quality
      ? HEIGHT_QUALITY_CONFIG[heightData.quality]?.label || heightData.quality
      : "Belum dinilai",
    floors: positiveNumber(asset.building_floors),
    lod: asset.model_3d_lod || (asset.building_footprint ? "LOD0" : null),
    crs: asset.model_3d_source_crs || null,
    recordedAt: asset.model_3d_recorded_at || null,
    accuracy: positiveNumber(asset.model_3d_accuracy_m),
  };
};

export const buildAssetBuildingFeature = (asset) => {
  const geometry = normalizePolygonToGeometry(asset?.building_footprint);
  const summary = getAsset3dSummary(asset);
  if (!geometry || !summary.height) return null;
  return {
    type: "Feature",
    id: asset?.id_aset || asset?.id,
    properties: {
      id_aset: asset?.id_aset || asset?.id || null,
      kode_aset: asset?.kode_aset || null,
      nama_aset: asset?.nama_aset || asset?.nama || null,
      height_m: summary.height,
      height_quality: summary.quality,
      height_source: summary.source,
      floors: summary.floors,
      lod: summary.lod || "LOD1",
      source_crs: summary.crs,
      recorded_at: summary.recordedAt,
      accuracy_m: summary.accuracy,
    },
    geometry,
  };
};

export const buildAssetBuildingFeatureCollection = (
  assets = [],
  { fallbackOnly = false } = {},
) => ({
  type: "FeatureCollection",
  features: assets
    .filter(
      (asset) =>
        !fallbackOnly ||
        !hasDetailedModel(asset),
    )
    .map(buildAssetBuildingFeature)
    .filter(Boolean),
});

const getRingCentroid = (geometry) => {
  const ring = geometry?.type === "Polygon"
    ? geometry.coordinates?.[0]
    : geometry?.coordinates?.[0]?.[0];
  if (!Array.isArray(ring) || ring.length < 3) return null;
  const valid = ring.filter((point) => Number.isFinite(point?.[0]) && Number.isFinite(point?.[1]));
  if (!valid.length) return null;
  return valid.reduce(
    (sum, point) => [sum[0] + point[0] / valid.length, sum[1] + point[1] / valid.length],
    [0, 0],
  );
};

const distanceMeters = ([lng1, lat1], [lng2, lat2]) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const assessBuildingFootprintLocation = (asset = {}) => {
  const building = normalizePolygonToGeometry(asset.building_footprint);
  if (!building) return { status: "missing", message: "Tapak bangunan belum tersedia." };
  const buildingCenter = getRingCentroid(building);
  const parcel = normalizePolygonToGeometry(asset.polygon_bidang || asset.polygon);
  const parcelCenter = getRingCentroid(parcel);
  const pointCenter =
    Number.isFinite(Number(asset.koordinat_long)) && Number.isFinite(Number(asset.koordinat_lat))
      ? [Number(asset.koordinat_long), Number(asset.koordinat_lat)]
      : null;
  const reference = parcelCenter || pointCenter;
  if (!buildingCenter || !reference) {
    return { status: "unchecked", message: "Belum ada geometri pembanding untuk memeriksa lokasi." };
  }
  const distance = distanceMeters(buildingCenter, reference);
  const limit = parcelCenter ? 500 : 250;
  return distance <= limit
    ? { status: "ok", distance, message: `Pusat tapak berjarak sekitar ${Math.round(distance)} m dari referensi aset.` }
    : {
        status: "warning",
        distance,
        message: `Tapak bangunan berjarak sekitar ${Math.round(distance)} m dari referensi aset. Periksa CRS dan lokasi sebelum menyimpan.`,
      };
};
