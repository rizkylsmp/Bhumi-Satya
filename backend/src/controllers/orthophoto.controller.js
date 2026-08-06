import crypto from "node:crypto";
import { Op } from "sequelize";
import { Orthophoto } from "../models/index.js";
import AuditService from "../services/audit.service.js";
import {
  createOrthophotoPreview,
  inspectOrthophoto,
  normalizeBounds,
} from "../services/orthophoto.service.js";
import {
  deleteFromSupabase,
  uploadToSupabase,
} from "../utils/r2Storage.js";

const parsePositiveInteger = (value, fallback, maximum = 100) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0
    ? Math.min(parsed, maximum)
    : fallback;
};

const parseRelatedCodes = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Fall through to comma-separated input.
  }
  return String(value).split(",");
};

const normalizeRelatedCodes = (value) => [
  ...new Set(parseRelatedCodes(value)
    .map((code) => String(code || "").trim())
    .filter(Boolean)),
];

const serialize = (record) => {
  const value = record?.toJSON ? record.toJSON() : record;
  return {
    ...value,
    opacity: Number(value.opacity ?? 1),
    bounds: {
      west: Number(value.bounds_west),
      south: Number(value.bounds_south),
      east: Number(value.bounds_east),
      north: Number(value.bounds_north),
    },
  };
};

const toBasemap = (record) => {
  const item = serialize(record);
  return {
    id: `internal-orthophoto-${item.id_orthophoto}`,
    orthophoto_id: item.id_orthophoto,
    label: item.name,
    kind: "single-image",
    imageUrl: item.preview_public_url,
    bounds: item.bounds,
    opacity: item.opacity,
    attribution: item.source || "Orthophoto Bhumi Satya",
    acquisition_date: item.acquisition_date,
  };
};

export const published = async (_req, res) => {
  try {
    const rows = await Orthophoto.findAll({
      where: { status: "published" },
      order: [["acquisition_date", "DESC"], ["created_at", "DESC"]],
    });
    return res.json({ success: true, data: rows.map(toBasemap) });
  } catch (error) {
    console.error("Error listing published orthophotos:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const list = async (req, res) => {
  try {
    const page = parsePositiveInteger(req.query.page, 1, 100000);
    const limit = parsePositiveInteger(req.query.limit, 10, 50);
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "all");
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { source: { [Op.iLike]: `%${search}%` } },
        { source_crs: { [Op.iLike]: `%${search}%` } },
        { original_name: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (["draft", "published"].includes(status)) where.status = status;

    const { rows, count } = await Orthophoto.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [["created_at", "DESC"]],
    });
    return res.json({
      success: true,
      data: rows.map(serialize),
      pagination: {
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(count / limit)),
        totalItems: count,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Error listing orthophotos:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const create = async (req, res) => {
  let sourceStoragePath;
  let previewStoragePath;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "File GeoTIFF wajib dipilih" });
    }
    const name = String(req.body?.name || "").trim();
    if (!name) {
      return res.status(400).json({ success: false, error: "Nama orthophoto wajib diisi" });
    }

    const suppliedBounds = {
      west: req.body?.bounds_west,
      south: req.body?.bounds_south,
      east: req.body?.bounds_east,
      north: req.body?.bounds_north,
    };
    const inspection = await inspectOrthophoto(req.file.buffer, {
      sourceCrs: String(req.body?.source_crs || ""),
      bounds: normalizeBounds(suppliedBounds) || suppliedBounds,
    });
    const preview = await createOrthophotoPreview(req.file.buffer);
    const id = crypto.randomUUID();
    const originalExtension = req.file.originalname.toLowerCase().endsWith(".tiff")
      ? "tiff"
      : "tif";
    sourceStoragePath = `orthophotos/${id}/source.${originalExtension}`;
    previewStoragePath = `orthophotos/${id}/preview.webp`;
    const [publicUrl, previewPublicUrl] = await Promise.all([
      uploadToSupabase(sourceStoragePath, req.file.buffer, req.file.mimetype || "image/tiff"),
      uploadToSupabase(previewStoragePath, preview.data, "image/webp"),
    ]);

    const record = await Orthophoto.create({
      id_orthophoto: id,
      name,
      description: String(req.body?.description || "").trim() || null,
      source: String(req.body?.source || "").trim() || null,
      acquisition_date: req.body?.acquisition_date || null,
      source_crs: inspection.sourceCrs,
      bounds_west: inspection.bounds.west,
      bounds_south: inspection.bounds.south,
      bounds_east: inspection.bounds.east,
      bounds_north: inspection.bounds.north,
      original_name: req.file.originalname,
      storage_path: sourceStoragePath,
      public_url: publicUrl,
      preview_storage_path: previewStoragePath,
      preview_public_url: previewPublicUrl,
      mime_type: req.file.mimetype || "image/tiff",
      file_size_bytes: req.file.size,
      raster_width: inspection.width,
      raster_height: inspection.height,
      related_kode_2d: normalizeRelatedCodes(req.body?.related_kode_2d),
      status: "draft",
      opacity: 1,
      created_by: req.user.id_user,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await AuditService.logCreate({
      tabel: "orthophotos",
      id_referensi: null,
      data_baru: record.toJSON(),
      keterangan: `Mengunggah orthophoto ${record.name}`,
      user_id: req.user.id_user,
      req,
    });
    return res.status(201).json({
      success: true,
      message: "Orthophoto berhasil diunggah sebagai draf",
      data: serialize(record),
    });
  } catch (error) {
    await Promise.allSettled(
      [sourceStoragePath, previewStoragePath]
        .filter(Boolean)
        .map((path) => deleteFromSupabase(path)),
    );
    console.error("Error uploading orthophoto:", error);
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const record = await Orthophoto.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, error: "Orthophoto tidak ditemukan" });
    }
    const oldData = record.toJSON();
    const nextBounds = normalizeBounds({
      west: req.body?.bounds_west ?? record.bounds_west,
      south: req.body?.bounds_south ?? record.bounds_south,
      east: req.body?.bounds_east ?? record.bounds_east,
      north: req.body?.bounds_north ?? record.bounds_north,
    });
    if (!nextBounds) {
      return res.status(400).json({ success: false, error: "Batas koordinat tidak valid" });
    }
    const opacity = Number(req.body?.opacity ?? record.opacity);
    await record.update({
      name: String(req.body?.name ?? record.name).trim(),
      description: String(req.body?.description ?? record.description ?? "").trim() || null,
      source: String(req.body?.source ?? record.source ?? "").trim() || null,
      acquisition_date: req.body?.acquisition_date || null,
      source_crs: String(req.body?.source_crs ?? record.source_crs).trim(),
      bounds_west: nextBounds.west,
      bounds_south: nextBounds.south,
      bounds_east: nextBounds.east,
      bounds_north: nextBounds.north,
      related_kode_2d: normalizeRelatedCodes(
        req.body?.related_kode_2d ?? record.related_kode_2d,
      ),
      opacity: Number.isFinite(opacity) ? Math.min(1, Math.max(0.1, opacity)) : 1,
      updated_at: new Date(),
    });
    await AuditService.logUpdate({
      tabel: "orthophotos",
      id_referensi: null,
      data_lama: oldData,
      data_baru: record.toJSON(),
      keterangan: `Memperbarui orthophoto ${record.name}`,
      user_id: req.user.id_user,
      req,
    });
    return res.json({ success: true, message: "Orthophoto berhasil diperbarui", data: serialize(record) });
  } catch (error) {
    console.error("Error updating orthophoto:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const setPublished = async (req, res) => {
  try {
    const record = await Orthophoto.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, error: "Orthophoto tidak ditemukan" });
    }
    const publishedStatus = req.body?.published === true;
    const oldData = record.toJSON();
    await record.update({
      status: publishedStatus ? "published" : "draft",
      published_at: publishedStatus ? new Date() : null,
      updated_at: new Date(),
    });
    await AuditService.logUpdate({
      tabel: "orthophotos",
      id_referensi: null,
      data_lama: oldData,
      data_baru: record.toJSON(),
      keterangan: `${publishedStatus ? "Mempublikasikan" : "Menonaktifkan"} orthophoto ${record.name}`,
      user_id: req.user.id_user,
      req,
    });
    return res.json({
      success: true,
      message: publishedStatus
        ? "Orthophoto tampil di pilihan basemap"
        : "Orthophoto dinonaktifkan dari pilihan basemap",
      data: serialize(record),
    });
  } catch (error) {
    console.error("Error publishing orthophoto:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const record = await Orthophoto.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, error: "Orthophoto tidak ditemukan" });
    }
    const oldData = record.toJSON();
    await record.destroy();
    const cleanup = await Promise.allSettled([
      deleteFromSupabase(record.storage_path),
      deleteFromSupabase(record.preview_storage_path),
    ]);
    await AuditService.logDelete({
      tabel: "orthophotos",
      id_referensi: null,
      data_lama: oldData,
      keterangan: `Menghapus orthophoto ${record.name}`,
      user_id: req.user.id_user,
      req,
    });
    return res.json({
      success: true,
      message: "Orthophoto berhasil dihapus permanen",
      storage_cleanup_failed_count: cleanup.filter((item) => item.status === "rejected").length,
    });
  } catch (error) {
    console.error("Error deleting orthophoto:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
