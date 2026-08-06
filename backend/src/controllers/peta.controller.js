import { Op } from "sequelize";
import {
  Aset,
  Aset2dCatalog,
  Aset3dCatalog,
  AsetModel3d,
  SewaAset,
} from "../models/index.js";
import { hasPermission, PERMISSIONS } from "../middleware/auth.middleware.js";
import { createModel3dTileset } from "../utils/model3dTileset.js";

const normalizeSumber = (value) => {
  const normalized = String(value || "").toUpperCase().trim();
  return ["BPN", "BPKA"].includes(normalized) ? normalized : null;
};

const configuredPublicMarkersCacheTtlMs = Number(
  process.env.PUBLIC_MARKERS_CACHE_TTL_MS || 60_000,
);
const publicMarkersCacheTtlMs = Number.isFinite(
  configuredPublicMarkersCacheTtlMs,
)
  ? Math.max(0, configuredPublicMarkersCacheTtlMs)
  : 60_000;
let publicMarkersCache = { data: null, expiresAt: 0 };

const sendPublicMarkers = (res, markers, cacheStatus) => {
  res.setHeader(
    "Cache-Control",
    "public, max-age=30, stale-while-revalidate=120",
  );
  res.setHeader("X-Bhumi-Cache", cacheStatus);
  return res.json({ success: true, data: markers });
};

const popupExtendedAssetAttributes = [
  "batas_utara",
  "batas_selatan",
  "batas_timur",
  "batas_barat",
  "id_pemda",
  "kode_barang",
  "no_register",
  "luas_kib",
  "harga_perolehan",
  "penggunaan_kib",
  "tanggal_scan",
  "plotting_status",
  "kode_bmd",
  "nilai_aset",
  "nilai_buku",
  "nilai_njop",
  "sk_penetapan",
];

const serializePopupExtendedFields = (asset) => ({
  batas_utara: asset.batas_utara || null,
  batas_selatan: asset.batas_selatan || null,
  batas_timur: asset.batas_timur || null,
  batas_barat: asset.batas_barat || null,
  id_pemda: asset.id_pemda || null,
  kode_barang: asset.kode_barang || null,
  no_register: asset.no_register || null,
  luas_kib: asset.luas_kib,
  harga_perolehan: asset.harga_perolehan,
  penggunaan_kib: asset.penggunaan_kib || null,
  tanggal_scan: asset.tanggal_scan || null,
  plotting_status: asset.plotting_status || null,
  kode_bmd: asset.kode_bmd || null,
  nilai_aset: asset.nilai_aset,
  nilai_buku: asset.nilai_buku,
  nilai_njop: asset.nilai_njop,
  sk_penetapan: asset.sk_penetapan || null,
});

const getPublishedModelAssetIds = async () => {
  const models = await AsetModel3d.findAll({
    attributes: ["id_aset"],
    where: {
      is_active: true,
      status: "ready",
      conversion_status: "ready",
      archived_at: null,
    },
    raw: true,
  });
  return [...new Set(models.map((model) => model.id_aset).filter(Boolean))];
};

const buildMapAssetLocationFilters = (publishedModelAssetIds = []) => {
  const filters = [
    {
      koordinat_lat: { [Op.ne]: null },
      koordinat_long: { [Op.ne]: null },
    },
    { polygon_bidang: { [Op.ne]: null } },
  ];
  if (publishedModelAssetIds.length > 0) {
    filters.push({ id_aset: { [Op.in]: publishedModelAssetIds } });
  }
  return filters;
};

export const getModel3dTileset = async (req, res) => {
  try {
    const requestedAssetIds = String(req.query.asset_ids || "")
      .split(",")
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0)
      .slice(0, 1000);
    const modelWhere = {
      is_active: true,
      status: "ready",
      conversion_status: "ready",
      archived_at: null,
    };
    if (requestedAssetIds.length > 0) modelWhere.id_aset = { [Op.in]: requestedAssetIds };
    const models = await AsetModel3d.findAll({
      attributes: [
        "id_model_3d",
        "id_aset",
        "kode_3d",
        "lod",
        "version",
        "format",
        "model_type",
        "converted_public_url",
        "converted_bounds",
        "converted_triangle_count",
        "lod_medium_public_url",
        "lod_medium_triangle_count",
        "lod_low_public_url",
        "lod_low_triangle_count",
        "location_lat",
        "location_long",
        "altitude_m",
        "heading",
        "tilt",
        "roll",
        "scale_x",
        "scale_y",
        "scale_z",
        "offset_x_m",
        "offset_y_m",
        "offset_z_m",
        "manifest",
      ],
      where: modelWhere,
      include: [{
        model: Aset,
        as: "aset",
        attributes: [
          "koordinat_lat",
          "koordinat_long",
          "building_height_m",
          "building_base_elevation_m",
        ],
        required: true,
      }],
      order: [["id_aset", "ASC"]],
    });
    const tileset = createModel3dTileset(models.map((model) => {
      const value = model.toJSON();
      return {
        ...value,
        location_lat: value.location_lat ?? value.aset?.koordinat_lat,
        location_long: value.location_long ?? value.aset?.koordinat_long,
      };
    }));
    if (!tileset) {
      return res.status(404).json({ success: false, error: "Belum ada model 3D aktif untuk tileset" });
    }
    // Transformasi posisi model dapat diubah dari preview Kelola 3D.
    // Jangan gunakan tileset lama setelah metadata X/Y/Z disimpan.
    res.setHeader("Cache-Control", "private, no-store");
    return res.json(tileset);
  } catch (error) {
    console.error("Error generating model 3D tileset:", error);
    return res.status(500).json({ success: false, error: "Gagal membuat tileset model 3D" });
  }
};

const appendExplicitSourceFilters = (where, query = {}) => {
  const sumber = normalizeSumber(query.sumber || query.instansi);
  if (sumber) where.sumber = sumber;
  if (query.reconciliation_status) {
    where.reconciliation_status = query.reconciliation_status;
  }
  return where;
};

/**
 * Get public markers for the shared public/admin map (no auth required).
 * Only map-safe metadata is exposed; private rental and audit data stay hidden.
 * GET /api/peta/public-markers
 */
export const getPublicMarkers = async (req, res) => {
  try {
    if (
      publicMarkersCache.data &&
      publicMarkersCache.expiresAt > Date.now()
    ) {
      return sendPublicMarkers(res, publicMarkersCache.data, "HIT");
    }

    const publishedModelAssetIds = await getPublishedModelAssetIds();

    const assets = await Aset.findAll({
      where: {
        [Op.or]: buildMapAssetLocationFilters(publishedModelAssetIds),
      },
      attributes: [
        "id_aset",
        "kode_aset",
        "nib",
        "nama_aset",
        "lokasi",
        "koordinat_lat",
        "koordinat_long",
        "status",
        "status_sertifikat",
        "nomor_sertifikat",
        "luas",
        "jenis_aset",
        "tahun_perolehan",
        "jenis_hak",
        "kecamatan",
        "desa_kelurahan",
        "penggunaan_saat_ini",
        "luas_lapangan",
        "opd_pengguna",
        "atas_nama",
        "nibar",
        "kw",
        "polygon_bidang",
        "building_height_m",
        "building_base_elevation_m",
        "building_floors",
        "building_height_source",
        "building_height_quality",
        "model_3d_lod",
        "model_3d_source_crs",
        "model_3d_recorded_at",
        "model_3d_accuracy_m",
        ...popupExtendedAssetAttributes,
        "pajak_fid",
        "pajak_status",
        "nop",
        "nama_wajib_pajak",
        "nilai_bumi_per_m2",
        "nilai_bangunan_per_m2",
        "luas_bumi_bapenda",
        "luas_bangunan_bapenda",
        "luas_bumi_pemetaan",
        "luas_bangunan_pemetaan",
        "njop_bumi_pemetaan",
        "njop_bangunan_pemetaan",
        "pbb_pemetaan",
        "sumber",
      ],
      include: [
        {
          model: Aset2dCatalog,
          as: "catalog2d",
          attributes: ["kode_2d", "is_managed"],
          required: false,
        },
        {
          model: Aset3dCatalog,
          as: "catalogs3d",
          attributes: ["kode_3d", "kode_2d", "building_name"],
          where: { status: "active" },
          required: false,
        },
        {
          model: SewaAset,
          as: "sewas",
          attributes: ["id_sewa", "status"],
          required: false,
        },
        {
          model: AsetModel3d,
          as: "models3d",
          attributes: [
            "id_model_3d",
            "kode_3d",
            "lod",
            "version",
            "format",
            "model_type",
            "conversion_status",
            "converted_public_url",
            "converted_bounds",
            "location_lat",
            "location_long",
            "altitude_m",
            "altitude_mode",
            "heading",
            "tilt",
            "roll",
            "scale_x",
            "scale_y",
            "scale_z",
            "offset_x_m",
            "offset_y_m",
            "offset_z_m",
          ],
          where: {
            is_active: true,
            status: "ready",
            conversion_status: "ready",
            archived_at: null,
          },
          required: false,
        },
      ],
    });

    const markers = assets.map((asset) => {
      const plain = asset.toJSON();
      const activeSewa = plain.sewas?.find(
        (sewa) => sewa.status === "Disewakan" || sewa.status === "Akan Berakhir",
      );
      const availableSewa = plain.sewas?.find(
        (sewa) => sewa.status === "Tersedia",
      );
      const buildingNamesByCode = Object.fromEntries(
        (plain.catalogs3d || []).map((catalog) => [
          catalog.kode_3d,
          catalog.building_name || catalog.kode_3d,
        ]),
      );
      const activeModels3d = (plain.models3d || []).map((model) => ({
        ...model,
        building_name: buildingNamesByCode[model.kode_3d]
          || model.kode_3d,
      }));
      const activeModel3d = activeModels3d[0] || null;

      return {
        id: plain.id_aset,
        kode: plain.kode_aset,
        kode_aset: plain.kode_aset,
        kode_3d: plain.catalogs3d?.[0]?.kode_3d || null,
        kode_3d_list: (plain.catalogs3d || []).map((catalog) => catalog.kode_3d),
        building_count_3d: plain.catalogs3d?.length || 0,
        building_name_3d: plain.catalogs3d?.[0]?.building_name
          || plain.catalogs3d?.[0]?.kode_3d
          || null,
        kode_2d: plain.catalog2d?.is_managed
          ? plain.catalog2d.kode_2d
          : plain.catalogs3d?.[0]?.kode_2d || null,
        nib: plain.nib || null,
        nama: plain.nama_aset,
        nama_aset: plain.nama_aset,
        lokasi: plain.lokasi || null,
        lat: plain.koordinat_lat ? parseFloat(plain.koordinat_lat) : null,
        lng: plain.koordinat_long ? parseFloat(plain.koordinat_long) : null,
        latitude: plain.koordinat_lat ? parseFloat(plain.koordinat_lat) : null,
        longitude: plain.koordinat_long ? parseFloat(plain.koordinat_long) : null,
        status: plain.status,
        status_sertifikat: plain.status_sertifikat || null,
        nomor_sertifikat: plain.nomor_sertifikat || null,
        luas: plain.luas ? parseFloat(plain.luas) : null,
        jenis: plain.jenis_aset || null,
        jenis_aset: plain.jenis_aset || null,
        tahun: plain.tahun_perolehan || null,
        jenis_hak: plain.jenis_hak || null,
        kecamatan: plain.kecamatan || null,
        desa_kelurahan: plain.desa_kelurahan || null,
        penggunaan_saat_ini: plain.penggunaan_saat_ini || null,
        luas_lapangan: plain.luas_lapangan
          ? parseFloat(plain.luas_lapangan)
          : null,
        opd_pengguna: plain.opd_pengguna || null,
        atas_nama: plain.atas_nama || null,
        nibar: plain.nibar || null,
        kw: plain.kw || null,
        polygon: plain.polygon_bidang || null,
        building_height_m: plain.building_height_m
          ? parseFloat(plain.building_height_m)
          : null,
        building_base_elevation_m: plain.building_base_elevation_m
          ? parseFloat(plain.building_base_elevation_m)
          : null,
        building_floors: plain.building_floors || null,
        building_height_source: plain.building_height_source || null,
        building_height_quality: plain.building_height_quality || null,
        model_3d_lod: plain.model_3d_lod || null,
        model_3d_source_crs: plain.model_3d_source_crs || null,
        model_3d_recorded_at: plain.model_3d_recorded_at || null,
        model_3d_accuracy_m: plain.model_3d_accuracy_m
          ? parseFloat(plain.model_3d_accuracy_m)
          : null,
        ...serializePopupExtendedFields(plain),
        pajak_fid: plain.pajak_fid,
        pajak_status: plain.pajak_status || null,
        nop: plain.nop || null,
        nama_wajib_pajak: plain.nama_wajib_pajak || null,
        nilai_bumi_per_m2: plain.nilai_bumi_per_m2,
        nilai_bangunan_per_m2: plain.nilai_bangunan_per_m2,
        luas_bumi_bapenda: plain.luas_bumi_bapenda,
        luas_bangunan_bapenda: plain.luas_bangunan_bapenda,
        luas_bumi_pemetaan: plain.luas_bumi_pemetaan,
        luas_bangunan_pemetaan: plain.luas_bangunan_pemetaan,
        njop_bumi_pemetaan: plain.njop_bumi_pemetaan,
        njop_bangunan_pemetaan: plain.njop_bangunan_pemetaan,
        pbb_pemetaan: plain.pbb_pemetaan,
        active_model_3d: activeModel3d,
        active_models_3d: activeModels3d,
        sumber: plain.sumber || null,
        status_sewa: activeSewa
          ? "Tersewa"
          : availableSewa
            ? "Tersedia"
            : "Tidak Disewakan",
      };
    });

    publicMarkersCache = {
      data: markers,
      expiresAt: Date.now() + publicMarkersCacheTtlMs,
    };
    return sendPublicMarkers(res, markers, "MISS");
  } catch (error) {
    console.error("Error fetching public markers:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get available map layers for user
 * GET /api/peta/layers
 */
export const getLayers = async (req, res) => {
  try {
    const { role } = req.user;

    // Build available layers based on role permissions
    const layers = [];

    // Layer Umum - semua role
    if (hasPermission(role, PERMISSIONS.LAYER_UMUM)) {
      layers.push({
        id: "umum",
        name: "Layer Umum",
        description: "Peta dasar dengan lokasi aset",
        enabled: true,
      });
    }

    // Layer Tata Ruang
    if (hasPermission(role, PERMISSIONS.LAYER_TATA_RUANG)) {
      layers.push({
        id: "tata_ruang",
        name: "Rencana Tata Ruang",
        description: "Layer rencana tata ruang wilayah",
        enabled: true,
      });
    }

    // Layer Potensi Bermasalah
    if (hasPermission(role, PERMISSIONS.LAYER_POTENSI_BERPERKARA)) {
      layers.push({
        id: "potensi_bermasalah",
        name: "Potensi Aset Bermasalah",
        description: "Layer aset dengan potensi sengketa/konflik/perkara",
        enabled: true,
      });
    }

    // Layer Sebaran Perkara
    if (hasPermission(role, PERMISSIONS.LAYER_SEBARAN_PERKARA)) {
      layers.push({
        id: "sebaran_perkara",
        name: "Sebaran Perkara",
        description: "Layer sebaran kasus perkara tanah",
        enabled: true,
      });
    }

    res.json({
      success: true,
      data: {
        role,
        layers,
        totalLayers: layers.length,
      },
    });
  } catch (error) {
    console.error("Error fetching layers:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get all map markers
 * GET /api/peta/markers
 */
export const getMarkers = async (req, res) => {
  try {
    const { status, jenis_aset } = req.query;
    const publishedModelAssetIds = await getPublishedModelAssetIds();

    const where = {
      [Op.or]: buildMapAssetLocationFilters(publishedModelAssetIds),
    };
    appendExplicitSourceFilters(where, req.query);

    if (status) where.status = status;
    if (jenis_aset) where.jenis_aset = jenis_aset;

    const assets = await Aset.findAll({
      where,
      attributes: [
        "id_aset",
        "kode_aset",
        "nib",
        "nama_aset",
        "lokasi",
        "koordinat_lat",
        "koordinat_long",
        "status",
        "status_sertifikat",
        "jenis_masalah",
        "luas",
        "jenis_aset",
        "tahun_perolehan",
        "nomor_sertifikat",
        "jenis_hak",
        "kecamatan",
        "desa_kelurahan",
        "penggunaan_saat_ini",
        "luas_lapangan",
        "opd_pengguna",
        "atas_nama",
        "status_hukum",
        "keterangan",
        "nibar",
        "kw",
        "polygon_bidang",
        "building_height_m",
        "building_base_elevation_m",
        "building_floors",
        "building_height_source",
        "building_height_quality",
        "model_3d_lod",
        "model_3d_source_crs",
        "model_3d_recorded_at",
        "model_3d_accuracy_m",
        ...popupExtendedAssetAttributes,
        "pajak_fid",
        "pajak_status",
        "nop",
        "nama_wajib_pajak",
        "nilai_bumi_per_m2",
        "nilai_bangunan_per_m2",
        "luas_bumi_bapenda",
        "luas_bangunan_bapenda",
        "luas_bumi_pemetaan",
        "luas_bangunan_pemetaan",
        "njop_bumi_pemetaan",
        "njop_bangunan_pemetaan",
        "pbb_pemetaan",
        "sumber",
      ],
      include: [
        {
          model: Aset2dCatalog,
          as: "catalog2d",
          attributes: ["kode_2d", "is_managed"],
          required: false,
        },
        {
          model: Aset3dCatalog,
          as: "catalogs3d",
          attributes: ["kode_3d", "kode_2d", "building_name"],
          where: { status: "active" },
          required: false,
        },
        {
          model: SewaAset,
          as: "sewas",
          attributes: ["id_sewa", "status", "nama_penyewa"],
          required: false,
        },
        {
          model: AsetModel3d,
          as: "models3d",
          attributes: [
            "id_model_3d",
            "kode_3d",
            "lod",
            "version",
            "format",
            "model_type",
            "model_entry",
            "public_url",
            "conversion_status",
            "converted_public_url",
            "converted_size_bytes",
            "location_lat",
            "location_long",
            "altitude_m",
            "altitude_mode",
            "heading",
            "tilt",
            "roll",
            "scale_x",
            "scale_y",
            "scale_z",
            "offset_x_m",
            "offset_y_m",
            "offset_z_m",
            "manifest",
          ],
          where: {
            is_active: true,
            archived_at: null,
            status: "ready",
            conversion_status: "ready",
          },
          required: false,
        },
      ],
    });

    // Transform to marker format
    const markers = assets.map((asset) => {
      const plain = asset.toJSON();
      const activeSewa = plain.sewas?.find(
        (s) => s.status === "Disewakan" || s.status === "Akan Berakhir",
      );
      const availableSewa = plain.sewas?.find((s) => s.status === "Tersedia");
      const statusSewa = activeSewa
        ? "Tersewa"
        : availableSewa
          ? "Tersedia"
          : "Tidak Disewakan";
      const buildingNamesByCode = Object.fromEntries(
        (plain.catalogs3d || []).map((catalog) => [
          catalog.kode_3d,
          catalog.building_name || catalog.kode_3d,
        ]),
      );
      const activeModels3d = (plain.models3d || []).map((model) => ({
        ...model,
        building_name: buildingNamesByCode[model.kode_3d]
          || model.kode_3d,
      }));
      const activeModel3d = activeModels3d[0] || null;

      return {
        id: plain.id_aset,
        kode: plain.kode_aset,
        kode_3d: plain.catalogs3d?.[0]?.kode_3d || null,
        kode_3d_list: (plain.catalogs3d || []).map((catalog) => catalog.kode_3d),
        building_count_3d: plain.catalogs3d?.length || 0,
        building_name_3d: plain.catalogs3d?.[0]?.building_name
          || plain.catalogs3d?.[0]?.kode_3d
          || null,
        kode_2d: plain.catalog2d?.is_managed
          ? plain.catalog2d.kode_2d
          : plain.catalogs3d?.[0]?.kode_2d || null,
        nib: plain.nib || null,
        nama: plain.nama_aset,
        lokasi: plain.lokasi,
        lat: parseFloat(plain.koordinat_lat),
        lng: parseFloat(plain.koordinat_long),
        status: plain.status,
        status_sertifikat: plain.status_sertifikat || null,
        jenis_masalah: plain.jenis_masalah,
        luas: plain.luas ? parseFloat(plain.luas) : null,
        jenis: plain.jenis_aset,
        tahun: plain.tahun_perolehan,
        nomor_sertifikat: plain.nomor_sertifikat || null,
        jenis_hak: plain.jenis_hak || null,
        kecamatan: plain.kecamatan || null,
        desa_kelurahan: plain.desa_kelurahan || null,
        penggunaan_saat_ini: plain.penggunaan_saat_ini || null,
        luas_lapangan: plain.luas_lapangan
          ? parseFloat(plain.luas_lapangan)
          : null,
        opd_pengguna: plain.opd_pengguna || null,
        atas_nama: plain.atas_nama || null,
        status_hukum: plain.status_hukum || null,
        keterangan: plain.keterangan || null,
        nibar: plain.nibar || null,
        kw: plain.kw || null,
        polygon: plain.polygon_bidang || null,
        building_height_m: plain.building_height_m
          ? parseFloat(plain.building_height_m)
          : null,
        building_base_elevation_m: plain.building_base_elevation_m
          ? parseFloat(plain.building_base_elevation_m)
          : null,
        building_floors: plain.building_floors || null,
        building_height_source: plain.building_height_source || null,
        building_height_quality: plain.building_height_quality || null,
        model_3d_lod: plain.model_3d_lod || null,
        model_3d_source_crs: plain.model_3d_source_crs || null,
        model_3d_recorded_at: plain.model_3d_recorded_at || null,
        model_3d_accuracy_m: plain.model_3d_accuracy_m
          ? parseFloat(plain.model_3d_accuracy_m)
          : null,
        ...serializePopupExtendedFields(plain),
        pajak_fid: plain.pajak_fid,
        pajak_status: plain.pajak_status || null,
        nop: plain.nop || null,
        nama_wajib_pajak: plain.nama_wajib_pajak || null,
        nilai_bumi_per_m2: plain.nilai_bumi_per_m2,
        nilai_bangunan_per_m2: plain.nilai_bangunan_per_m2,
        luas_bumi_bapenda: plain.luas_bumi_bapenda,
        luas_bangunan_bapenda: plain.luas_bangunan_bapenda,
        luas_bumi_pemetaan: plain.luas_bumi_pemetaan,
        luas_bangunan_pemetaan: plain.luas_bangunan_pemetaan,
        njop_bumi_pemetaan: plain.njop_bumi_pemetaan,
        njop_bangunan_pemetaan: plain.njop_bangunan_pemetaan,
        pbb_pemetaan: plain.pbb_pemetaan,
        active_model_3d: activeModel3d,
        active_models_3d: activeModels3d,
        sumber: plain.sumber || null,
        status_sewa: statusSewa,
        penyewa_aktif: activeSewa ? activeSewa.nama_penyewa : null,
        id_sewa_aktif: activeSewa?.id_sewa || availableSewa?.id_sewa || null,
      };
    });

    res.json({
      success: true,
      data: markers,
      total: markers.length,
    });
  } catch (error) {
    console.error("Error fetching markers:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get map statistics
 * GET /api/peta/stats
 */
export const getStats = async (req, res) => {
  try {
    const baseWhere = {};
    appendExplicitSourceFilters(baseWhere, req.query);

    // Count assets with coordinates
    const totalWithCoords = await Aset.count({
      where: {
        ...baseWhere,
        koordinat_lat: { [Op.ne]: null },
        koordinat_long: { [Op.ne]: null },
      },
    });

    const totalWithoutCoords = await Aset.count({
      where: {
        ...baseWhere,
        [Op.or]: [{ koordinat_lat: null }, { koordinat_long: null }],
      },
    });

    // Count by status (only with coordinates)
    const byStatus = await Aset.findAll({
      where: {
        ...baseWhere,
        koordinat_lat: { [Op.ne]: null },
        koordinat_long: { [Op.ne]: null },
      },
      attributes: ["status", [Aset.sequelize.fn("COUNT", "*"), "count"]],
      group: ["status"],
    });

    // Total luas by status
    const luasByStatus = await Aset.findAll({
      where: {
        ...baseWhere,
        koordinat_lat: { [Op.ne]: null },
        koordinat_long: { [Op.ne]: null },
      },
      attributes: [
        "status",
        [Aset.sequelize.fn("SUM", Aset.sequelize.col("luas")), "total_luas"],
      ],
      group: ["status"],
    });

    res.json({
      success: true,
      data: {
        totalMapped: totalWithCoords,
        totalUnmapped: totalWithoutCoords,
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = parseInt(item.dataValues.count);
          return acc;
        }, {}),
        luasByStatus: luasByStatus.reduce((acc, item) => {
          acc[item.status] = parseFloat(item.dataValues.total_luas) || 0;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error("Error fetching map stats:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get Layer Umum data
 * GET /api/peta/layer/umum
 */
export const getLayerUmum = async (req, res) => {
  try {
    const assets = await Aset.findAll({
      where: {
        koordinat_lat: { [Op.ne]: null },
        koordinat_long: { [Op.ne]: null },
      },
      attributes: [
        "id_aset",
        "kode_aset",
        "nama_aset",
        "lokasi",
        "koordinat_lat",
        "koordinat_long",
        "status",
        "luas",
        "jenis_aset",
      ],
    });

    const features = assets.map((asset) => ({
      type: "Feature",
      properties: {
        id: asset.id_aset,
        kode: asset.kode_aset,
        nama: asset.nama_aset,
        lokasi: asset.lokasi,
        status: asset.status,
        luas: asset.luas,
        jenis: asset.jenis_aset,
      },
      geometry: {
        type: "Point",
        coordinates: [
          parseFloat(asset.koordinat_long),
          parseFloat(asset.koordinat_lat),
        ],
      },
    }));

    res.json({
      success: true,
      data: {
        type: "FeatureCollection",
        features,
      },
      total: features.length,
    });
  } catch (error) {
    console.error("Error fetching layer umum:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get Layer Tata Ruang data
 * GET /api/peta/layer/tata-ruang
 */
export const getLayerTataRuang = async (req, res) => {
  try {
    const assets = await Aset.findAll({
      where: {
        koordinat_lat: { [Op.ne]: null },
        koordinat_long: { [Op.ne]: null },
      },
      attributes: [
        "id_aset",
        "kode_aset",
        "nama_aset",
        "lokasi",
        "koordinat_lat",
        "koordinat_long",
        "status",
        "luas",
        "jenis_aset",
        "tahun_perolehan",
        "nomor_sertifikat",
      ],
    });

    const features = assets.map((asset) => ({
      type: "Feature",
      properties: {
        id: asset.id_aset,
        kode: asset.kode_aset,
        nama: asset.nama_aset,
        lokasi: asset.lokasi,
        status: asset.status,
        luas: asset.luas,
        jenis: asset.jenis_aset,
        tahun: asset.tahun_perolehan,
        sertifikat: asset.nomor_sertifikat,
      },
      geometry: {
        type: "Point",
        coordinates: [
          parseFloat(asset.koordinat_long),
          parseFloat(asset.koordinat_lat),
        ],
      },
    }));

    res.json({
      success: true,
      data: {
        type: "FeatureCollection",
        features,
      },
      total: features.length,
    });
  } catch (error) {
    console.error("Error fetching layer tata ruang:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get Layer Potensi Bermasalah data
 * GET /api/peta/layer/potensi-berperkara
 */
export const getLayerPotensiBerperkara = async (req, res) => {
  try {
    const assets = await Aset.findAll({
      where: {
        koordinat_lat: { [Op.ne]: null },
        koordinat_long: { [Op.ne]: null },
        status: { [Op.in]: ["Bermasalah", "Indikasi Bermasalah"] },
      },
      attributes: [
        "id_aset",
        "kode_aset",
        "nama_aset",
        "lokasi",
        "koordinat_lat",
        "koordinat_long",
        "status",
        "jenis_masalah",
        "luas",
        "jenis_aset",
        "keterangan",
      ],
    });

    const features = assets.map((asset) => ({
      type: "Feature",
      properties: {
        id: asset.id_aset,
        kode: asset.kode_aset,
        nama: asset.nama_aset,
        lokasi: asset.lokasi,
        status: asset.status,
        luas: asset.luas,
        jenis: asset.jenis_aset,
        keterangan: asset.keterangan,
        risk_level: asset.status === "Bermasalah" ? "high" : "medium",
      },
      geometry: {
        type: "Point",
        coordinates: [
          parseFloat(asset.koordinat_long),
          parseFloat(asset.koordinat_lat),
        ],
      },
    }));

    res.json({
      success: true,
      data: {
        type: "FeatureCollection",
        features,
      },
      total: features.length,
      summary: {
        bermasalah: assets.filter((a) => a.status === "Bermasalah").length,
        indikasiBermasalah: assets.filter(
          (a) => a.status === "Indikasi Bermasalah",
        ).length,
      },
    });
  } catch (error) {
    console.error("Error fetching layer potensi bermasalah:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get Layer Sebaran Perkara data
 * GET /api/peta/layer/sebaran-perkara
 */
export const getLayerSebaranPerkara = async (req, res) => {
  try {
    const assets = await Aset.findAll({
      where: {
        koordinat_lat: { [Op.ne]: null },
        koordinat_long: { [Op.ne]: null },
        status: "Bermasalah",
      },
      attributes: [
        "id_aset",
        "kode_aset",
        "nama_aset",
        "lokasi",
        "koordinat_lat",
        "koordinat_long",
        "status",
        "luas",
        "jenis_aset",
        "keterangan",
        "tahun_perolehan",
      ],
    });

    const features = assets.map((asset) => ({
      type: "Feature",
      properties: {
        id: asset.id_aset,
        kode: asset.kode_aset,
        nama: asset.nama_aset,
        lokasi: asset.lokasi,
        status: asset.status,
        luas: asset.luas,
        jenis: asset.jenis_aset,
        keterangan: asset.keterangan,
        tahun: asset.tahun_perolehan,
      },
      geometry: {
        type: "Point",
        coordinates: [
          parseFloat(asset.koordinat_long),
          parseFloat(asset.koordinat_lat),
        ],
      },
    }));

    res.json({
      success: true,
      data: {
        type: "FeatureCollection",
        features,
      },
      total: features.length,
    });
  } catch (error) {
    console.error("Error fetching layer sebaran perkara:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Search assets on map
 * GET /api/peta/search
 */
export const search = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Query minimal 2 karakter",
      });
    }

    const assets = await Aset.findAll({
      where: appendExplicitSourceFilters({
        koordinat_lat: { [Op.ne]: null },
        koordinat_long: { [Op.ne]: null },
        [Op.or]: [
          { nama_aset: { [Op.iLike]: `%${q}%` } },
          { kode_aset: { [Op.iLike]: `%${q}%` } },
          { nibar: { [Op.iLike]: `%${q}%` } },
          { nomor_sertifikat: { [Op.iLike]: `%${q}%` } },
          { opd_pengguna: { [Op.iLike]: `%${q}%` } },
          { lokasi: { [Op.iLike]: `%${q}%` } },
        ],
      }, req.query),
      attributes: [
        "id_aset",
        "kode_aset",
        "nibar",
        "nama_aset",
        "lokasi",
        "koordinat_lat",
        "koordinat_long",
        "status",
      ],
      limit: parseInt(limit),
    });

    const results = assets.map((asset) => ({
      id: asset.id_aset,
      kode: asset.kode_aset,
      nibar: asset.nibar || null,
      nama: asset.nama_aset,
      lokasi: asset.lokasi,
      lat: parseFloat(asset.koordinat_lat),
      lng: parseFloat(asset.koordinat_long),
      status: asset.status,
    }));

    res.json({
      success: true,
      data: results,
      total: results.length,
    });
  } catch (error) {
    console.error("Error searching on map:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get asset detail for map popup
 * GET /api/peta/detail/:id
 */
export const getDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const asset = await Aset.findByPk(id, {
      attributes: [
        "id_aset",
        "kode_aset",
        "nama_aset",
        "lokasi",
        "koordinat_lat",
        "koordinat_long",
        "status",
        "luas",
        "jenis_aset",
        "tahun_perolehan",
        "nomor_sertifikat",
        "status_sertifikat",
        "nilai_aset",
        "keterangan",
        "foto_aset",
      ],
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: "Aset tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: asset,
    });
  } catch (error) {
    console.error("Error fetching asset detail:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
