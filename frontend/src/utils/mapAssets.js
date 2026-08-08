export function parseMapPolygon(raw) {
  if (!raw) return null;
  if (Array.isArray(raw) || typeof raw === "object") return raw;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function normalizeMapMarker(marker) {
  return {
    id: marker.id,
    kode_aset: marker.kode,
    kode_3d: marker.kode_3d || null,
    kode_3d_list: Array.isArray(marker.kode_3d_list)
      ? marker.kode_3d_list.filter(Boolean)
      : [],
    kode_2d: marker.kode_2d || null,
    building_count_3d: Number(marker.building_count_3d) || 0,
    building_name_3d: marker.building_name_3d || null,
    nib: marker.nib || null,
    nama_aset: marker.nama,
    lokasi: marker.lokasi,
    status: marker.status?.toLowerCase().replace(/\s+/g, "_") || "aktif",
    status_sertifikat: marker.status_sertifikat || null,
    jenis_masalah: marker.jenis_masalah || null,
    luas:
      marker.luas === null || marker.luas === undefined
        ? null
        : marker.luas.toString(),
    tahun:
      marker.tahun === null || marker.tahun === undefined
        ? null
        : marker.tahun.toString(),
    jenis_aset: marker.jenis,
    keterangan: marker.keterangan || null,
    latitude: marker.lat,
    longitude: marker.lng,
    polygon: parseMapPolygon(marker.polygon),
    nomor_sertifikat: marker.nomor_sertifikat || null,
    jenis_hak: marker.jenis_hak || null,
    kecamatan: marker.kecamatan || null,
    desa_kelurahan: marker.desa_kelurahan || null,
    penggunaan_saat_ini: marker.penggunaan_saat_ini || null,
    luas_lapangan: marker.luas_lapangan?.toString() || null,
    batas_utara: marker.batas_utara || null,
    batas_selatan: marker.batas_selatan || null,
    batas_timur: marker.batas_timur || null,
    batas_barat: marker.batas_barat || null,
    opd_pengguna: marker.opd_pengguna || null,
    atas_nama: marker.atas_nama || null,
    status_hukum: marker.status_hukum || null,
    nibar: marker.nibar || null,
    kw: marker.kw || null,
    id_pemda: marker.id_pemda || null,
    kode_barang: marker.kode_barang || null,
    no_register: marker.no_register || null,
    luas_kib: marker.luas_kib ?? null,
    harga_perolehan: marker.harga_perolehan ?? null,
    penggunaan_kib: marker.penggunaan_kib || null,
    tanggal_scan: marker.tanggal_scan || null,
    plotting_status: marker.plotting_status || null,
    kode_bmd: marker.kode_bmd || null,
    nilai_aset: marker.nilai_aset ?? null,
    nilai_buku: marker.nilai_buku ?? null,
    nilai_njop: marker.nilai_njop ?? null,
    sk_penetapan: marker.sk_penetapan || null,
    pajak_fid: marker.pajak_fid ?? null,
    pajak_status: marker.pajak_status || null,
    nop: marker.nop || null,
    nama_wajib_pajak: marker.nama_wajib_pajak || null,
    nilai_bumi_per_m2: marker.nilai_bumi_per_m2 ?? null,
    nilai_bangunan_per_m2: marker.nilai_bangunan_per_m2 ?? null,
    luas_bumi_bapenda: marker.luas_bumi_bapenda ?? null,
    luas_bangunan_bapenda: marker.luas_bangunan_bapenda ?? null,
    luas_bumi_pemetaan: marker.luas_bumi_pemetaan ?? null,
    luas_bangunan_pemetaan: marker.luas_bangunan_pemetaan ?? null,
    njop_bumi_pemetaan: marker.njop_bumi_pemetaan ?? null,
    njop_bangunan_pemetaan: marker.njop_bangunan_pemetaan ?? null,
    pbb_pemetaan: marker.pbb_pemetaan ?? null,
    status_sewa: marker.status_sewa || "Tidak Disewakan",
    penyewa_aktif: marker.penyewa_aktif || null,
    sumber: marker.sumber || null,
    building_height_m: marker.building_height_m ?? null,
    building_base_elevation_m: marker.building_base_elevation_m ?? null,
    building_floors: marker.building_floors ?? null,
    building_height_source: marker.building_height_source || null,
    building_height_quality: marker.building_height_quality || null,
    model_3d_lod: marker.model_3d_lod || null,
    model_3d_source_crs: marker.model_3d_source_crs || null,
    model_3d_recorded_at: marker.model_3d_recorded_at || null,
    model_3d_accuracy_m: marker.model_3d_accuracy_m ?? null,
    active_model_3d: marker.active_model_3d || null,
    active_models_3d: marker.active_models_3d || [],
  };
}

export const normalizeMapMarkers = (markers = []) => markers.map(normalizeMapMarker);
