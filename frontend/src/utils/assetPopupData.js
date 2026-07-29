const firstValue = (...values) =>
  values.find(
    (value) =>
      value !== null &&
      value !== undefined &&
      String(value).trim() !== "" &&
      String(value).trim() !== "-",
  ) ?? null;

export const hasPopupValue = (value) =>
  firstValue(value) !== null;

export const resolvePopupModel = (asset = {}, modelOverride = null) =>
  modelOverride ||
  asset.active_model_3d ||
  asset.active_models_3d?.find((model) => model?.is_active) ||
  asset.active_models_3d?.[0] ||
  null;

export const buildAssetPopupData = (asset = {}, modelOverride = null) => {
  const model = resolvePopupModel(asset, modelOverride);
  const details = [
    ["Jenis Aset", firstValue(asset.jenis_aset, asset.jenis)],
    ["NIB", asset.nib],
    ["NIBAR", asset.nibar],
    ["Status Sertifikat", asset.status_sertifikat],
    ["Nomor Sertifikat", asset.nomor_sertifikat],
    ["Jenis Hak", asset.jenis_hak],
    ["Atas Nama", asset.atas_nama],
    ["Penggunaan", asset.penggunaan_saat_ini],
    ["Kecamatan", asset.kecamatan],
    ["Desa/Kelurahan", asset.desa_kelurahan],
  ]
    .filter(([, value]) => hasPopupValue(value))
    .map(([label, value]) => ({ label, value }));

  return {
    title: firstValue(asset.nama_aset, asset.nama) || "Aset tanpa nama",
    assetCode: firstValue(asset.kode_aset, asset.kode),
    catalogCode: firstValue(asset.kode_3d, asset.catalog3d?.kode_3d),
    location: firstValue(asset.lokasi),
    description: firstValue(asset.keterangan),
    area: firstValue(asset.luas_lapangan, asset.luas),
    year: firstValue(asset.tahun_perolehan, asset.tahun),
    details,
    model: {
      available: Boolean(
        model ||
        hasPopupValue(asset.model_3d_lod) ||
        hasPopupValue(asset.building_height_m) ||
        hasPopupValue(asset.building_floors),
      ),
      recordAvailable: Boolean(model),
      id: model?.id_model_3d || null,
      lod: firstValue(model?.lod, asset.model_3d_lod),
      version: firstValue(model?.version),
      format: firstValue(model?.format, model?.model_type),
      height: firstValue(asset.building_height_m),
      floors: firstValue(asset.building_floors),
      sourceCrs: firstValue(model?.source_crs, asset.model_3d_source_crs),
      active: model ? model.is_active !== false : null,
    },
  };
};
