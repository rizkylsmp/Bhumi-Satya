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
    nib: marker.nib || null,
    nama_aset: marker.nama,
    lokasi: marker.lokasi,
    status: marker.status?.toLowerCase().replace(/\s+/g, "_") || "aktif",
    status_sertifikat: marker.status_sertifikat || null,
    jenis_masalah: marker.jenis_masalah || null,
    luas: marker.luas?.toString() || "0",
    tahun: marker.tahun?.toString() || "-",
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
    opd_pengguna: marker.opd_pengguna || null,
    atas_nama: marker.atas_nama || null,
    status_hukum: marker.status_hukum || null,
    nibar: marker.nibar || null,
    kw: marker.kw || null,
    status_sewa: marker.status_sewa || "Tidak Disewakan",
    penyewa_aktif: marker.penyewa_aktif || null,
    sumber: marker.sumber || null,
    building_footprint: parseMapPolygon(marker.building_footprint),
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
