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
  hasDetailedModel(asset);

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
    lod: asset.model_3d_lod || getActiveModels(asset)[0]?.lod || null,
    crs: asset.model_3d_source_crs || null,
    recordedAt: asset.model_3d_recorded_at || null,
    accuracy: positiveNumber(asset.model_3d_accuracy_m),
  };
};
