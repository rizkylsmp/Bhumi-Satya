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
  const assetName = firstValue(asset.nama_aset, asset.nama);
  const assetCode = firstValue(asset.kode_aset, asset.kode);
  const catalogCode = firstValue(asset.kode_3d, asset.catalog3d?.kode_3d);
  const general = [
    ["Kode Aset", assetCode],
    ["Nama Aset", assetName],
    ["Kode 3D", catalogCode],
    ["Jenis Aset", firstValue(asset.jenis_aset, asset.jenis)],
    ["Luas Terdata", asset.luas, "area"],
    ["Tahun Perolehan", firstValue(asset.tahun_perolehan, asset.tahun)],
  ]
    .filter(([, value]) => hasPopupValue(value))
    .map(([label, value, format]) => ({
      label,
      value,
      ...(format ? { format } : {}),
    }));

  const legal = [
    ["Status Sertifikat", asset.status_sertifikat],
    ["Nomor Sertifikat", asset.nomor_sertifikat],
    ["Jenis Hak", asset.jenis_hak],
    ["Atas Nama", asset.atas_nama],
  ]
    .filter(([, value]) => hasPopupValue(value))
    .map(([label, value]) => ({ label, value }));

  const physical = [
    ["Kecamatan", asset.kecamatan],
    ["Desa/Kelurahan", asset.desa_kelurahan],
    ["Penggunaan Saat Ini", asset.penggunaan_saat_ini],
    ["Luas Lapangan", asset.luas_lapangan, "area"],
    ["Batas Utara", asset.batas_utara],
    ["Batas Selatan", asset.batas_selatan],
    ["Batas Timur", asset.batas_timur],
    ["Batas Barat", asset.batas_barat],
  ]
    .filter(([, value]) => hasPopupValue(value))
    .map(([label, value, format]) => ({
      label,
      value,
      ...(format ? { format } : {}),
    }));

  const kib = [
    ["NIBAR", asset.nibar],
    ["ID Pemda", asset.id_pemda],
    ["Kode Barang", asset.kode_barang],
    ["Nomor Register", asset.no_register],
    ["Luas KIB", asset.luas_kib, "area"],
    ["Harga Perolehan", asset.harga_perolehan, "currency"],
    ["Penggunaan KIB", asset.penggunaan_kib],
    ["Tanggal Scan", asset.tanggal_scan],
    ["Status Plotting", asset.plotting_status],
  ]
    .filter(([, value]) => hasPopupValue(value))
    .map(([label, value, format]) => ({
      label,
      value,
      ...(format ? { format } : {}),
    }));

  const administrative = [
    ["Kode BMD", asset.kode_bmd],
    ["OPD Pengguna", asset.opd_pengguna],
    ["Nilai Aset", asset.nilai_aset, "currency"],
    ["Nilai Buku", asset.nilai_buku, "currency"],
    ["Nilai NJOP", asset.nilai_njop, "currency"],
    ["SK Penetapan", asset.sk_penetapan],
  ]
    .filter(([, value]) => hasPopupValue(value))
    .map(([label, value, format]) => ({
      label,
      value,
      ...(format ? { format } : {}),
    }));

  const latitude = firstValue(asset.koordinat_lat, asset.latitude, asset.lat);
  const longitude = firstValue(
    asset.koordinat_long,
    asset.longitude,
    asset.lng,
  );
  const spatial = [
    ["NIB", asset.nib],
    ["Kode Wilayah (KW)", asset.kw],
    ["Latitude", latitude, "coordinate"],
    ["Longitude", longitude, "coordinate"],
    [
      "Polygon Bidang",
      asset.polygon_bidang || asset.polygon ? "Tersedia" : null,
    ],
    ["Sumber Data", asset.sumber],
  ]
    .filter(([, value]) => hasPopupValue(value))
    .map(([label, value, format]) => ({
      label,
      value,
      ...(format ? { format } : {}),
    }));

  const tax = [
    ["Status Objek Pajak", asset.pajak_status],
    ["FID Pajak", asset.pajak_fid],
    ["NOP", asset.nop],
    ["Nama Wajib Pajak", asset.nama_wajib_pajak],
    ["Nilai Bumi/m²", asset.nilai_bumi_per_m2, "currency"],
    ["Nilai Bangunan/m²", asset.nilai_bangunan_per_m2, "currency"],
    ["Luas Bumi Bapenda", asset.luas_bumi_bapenda, "area"],
    ["Luas Bangunan Bapenda", asset.luas_bangunan_bapenda, "area"],
    ["Luas Bumi Pemetaan", asset.luas_bumi_pemetaan, "area"],
    ["Luas Bangunan Pemetaan", asset.luas_bangunan_pemetaan, "area"],
    ["NJOP Bumi Pemetaan", asset.njop_bumi_pemetaan, "currency"],
    ["NJOP Bangunan Pemetaan", asset.njop_bangunan_pemetaan, "currency"],
    ["PBB Pemetaan", asset.pbb_pemetaan, "currency"],
  ]
    .filter(([, value]) => hasPopupValue(value))
    .map(([label, value, format]) => ({
      label,
      value,
      ...(format ? { format } : {}),
    }));

  return {
    title: assetName || "Aset tanpa nama",
    assetCode,
    catalogCode,
    location: firstValue(asset.lokasi),
    description: firstValue(asset.keterangan),
    area: firstValue(asset.luas_lapangan, asset.luas),
    year: firstValue(asset.tahun_perolehan, asset.tahun),
    general,
    legal,
    physical,
    kib,
    administrative,
    spatial,
    tax,
    details: [...general, ...legal],
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
