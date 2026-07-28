import crypto from "node:crypto";
import { Op } from "sequelize";
import { AsetModel3d, AsetModel3dObject, sequelize } from "../models/index.js";
import AuditService from "../services/audit.service.js";
import {
  Model3dObjectValidationError,
  normalizeModel3dObject,
  parseCsv,
} from "../utils/model3dObject.js";

const findModel = (req) => AsetModel3d.findOne({
  where: {
    id_model_3d: req.params.modelId,
    id_aset: req.params.id,
    archived_at: null,
  },
});

export const list = async (req, res) => {
  try {
    const model = await findModel(req);
    if (!model) return res.status(404).json({ success: false, error: "Versi model 3D tidak ditemukan" });
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(5, Number.parseInt(req.query.limit, 10) || 10));
    const search = String(req.query.search || "").trim();
    const category = String(req.query.category || "").trim().toLowerCase();
    const where = { id_model_3d: model.id_model_3d };
    if (category && category !== "all") where.category = category;
    if (search) {
      where[Op.or] = [
        { object_code: { [Op.iLike]: `%${search}%` } },
        { name: { [Op.iLike]: `%${search}%` } },
        { usage: { [Op.iLike]: `%${search}%` } },
      ];
    }
    const { rows, count } = await AsetModel3dObject.findAndCountAll({
      where,
      order: [["object_code", "ASC"]],
      limit,
      offset: (page - 1) * limit,
    });
    return res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total: count, totalPages: Math.max(1, Math.ceil(count / limit)) },
    });
  } catch (error) {
    console.error("Error listing model 3D objects:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const model = await findModel(req);
    if (!model) return res.status(404).json({ success: false, error: "Versi model 3D tidak ditemukan" });
    const data = normalizeModel3dObject(req.body);
    const object = await AsetModel3dObject.create({
      id_object_3d: crypto.randomUUID(),
      id_model_3d: model.id_model_3d,
      ...data,
      created_by: req.user.id_user,
      updated_by: req.user.id_user,
    });
    await AuditService.logCreate({
      tabel: "aset_model_3d_object",
      id_referensi: model.id_model_3d,
      data_baru: object.toJSON(),
      keterangan: `Menambahkan objek ${object.object_code} pada model 3D versi ${model.version}`,
      user_id: req.user.id_user,
      req,
    });
    return res.status(201).json({ success: true, message: "Objek 3D berhasil ditambahkan", data: object });
  } catch (error) {
    const isDuplicate = error?.name === "SequelizeUniqueConstraintError";
    return res.status(isDuplicate ? 409 : error instanceof Model3dObjectValidationError ? 400 : 500).json({
      success: false,
      error: isDuplicate ? "Kode objek sudah digunakan pada model ini" : error.message,
    });
  }
};

export const update = async (req, res) => {
  try {
    const model = await findModel(req);
    if (!model) return res.status(404).json({ success: false, error: "Versi model 3D tidak ditemukan" });
    const object = await AsetModel3dObject.findOne({
      where: { id_object_3d: req.params.objectId, id_model_3d: model.id_model_3d },
    });
    if (!object) return res.status(404).json({ success: false, error: "Objek 3D tidak ditemukan" });
    const oldData = object.toJSON();
    const data = normalizeModel3dObject(req.body, { partial: true });
    await object.update({ ...data, updated_by: req.user.id_user, updated_at: new Date() });
    await AuditService.logUpdate({
      tabel: "aset_model_3d_object",
      id_referensi: model.id_model_3d,
      data_lama: oldData,
      data_baru: object.toJSON(),
      keterangan: `Memperbarui objek ${object.object_code} pada model 3D versi ${model.version}`,
      user_id: req.user.id_user,
      req,
    });
    return res.json({ success: true, message: "Objek 3D berhasil diperbarui", data: object });
  } catch (error) {
    const isDuplicate = error?.name === "SequelizeUniqueConstraintError";
    return res.status(isDuplicate ? 409 : error instanceof Model3dObjectValidationError ? 400 : 500).json({
      success: false,
      error: isDuplicate ? "Kode objek sudah digunakan pada model ini" : error.message,
    });
  }
};

export const remove = async (req, res) => {
  try {
    const model = await findModel(req);
    if (!model) return res.status(404).json({ success: false, error: "Versi model 3D tidak ditemukan" });
    const object = await AsetModel3dObject.findOne({
      where: { id_object_3d: req.params.objectId, id_model_3d: model.id_model_3d },
    });
    if (!object) return res.status(404).json({ success: false, error: "Objek 3D tidak ditemukan" });
    const oldData = object.toJSON();
    await object.destroy();
    await AuditService.logDelete({
      tabel: "aset_model_3d_object",
      id_referensi: model.id_model_3d,
      data_lama: oldData,
      keterangan: `Menghapus objek ${object.object_code} dari model 3D versi ${model.version}`,
      user_id: req.user.id_user,
      req,
    });
    return res.json({ success: true, message: "Objek 3D berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting model 3D object:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const downloadTemplate = async (_req, res) => {
  const csv = [
    "object_code,name,category,floor,usage,area_m2,volume_m3,height_m,properties_json",
    "BLD-001,Gedung Utama,bangunan,1,Kantor,250.5,3000,12,\"{\"\"warna\"\":\"\"putih\"\"}\"",
  ].join("\r\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=\"template-atribut-objek-3d.csv\"");
  return res.send(`\uFEFF${csv}`);
};

export const importCsv = async (req, res) => {
  try {
    const model = await findModel(req);
    if (!model) return res.status(404).json({ success: false, error: "Versi model 3D tidak ditemukan" });
    if (!req.file) return res.status(400).json({ success: false, error: "File CSV diperlukan" });
    const rows = parseCsv(req.file.buffer.toString("utf8"));
    if (rows.length > 2000) {
      return res.status(400).json({ success: false, error: "CSV maksimal 2.000 baris" });
    }
    const validRows = [];
    const failedRows = [];
    const seenCodes = new Set();
    rows.forEach((row, index) => {
      try {
        const normalized = normalizeModel3dObject(row);
        const normalizedCode = normalized.object_code.toLowerCase();
        if (seenCodes.has(normalizedCode)) {
          throw new Model3dObjectValidationError("Kode objek duplikat di dalam CSV");
        }
        seenCodes.add(normalizedCode);
        validRows.push({ ...normalized, rowNumber: index + 2 });
      } catch (error) {
        failedRows.push({
          row: index + 2,
          object_code: row.object_code || null,
          error: error.message,
        });
      }
    });

    let created = 0;
    let updated = 0;
    await sequelize.transaction(async (transaction) => {
      for (const row of validRows) {
        const { rowNumber: _rowNumber, ...data } = row;
        const [object, wasCreated] = await AsetModel3dObject.findOrCreate({
          where: { id_model_3d: model.id_model_3d, object_code: data.object_code },
          defaults: {
            id_object_3d: crypto.randomUUID(),
            ...data,
            created_by: req.user.id_user,
            updated_by: req.user.id_user,
          },
          transaction,
        });
        if (wasCreated) created += 1;
        else {
          await object.update({ ...data, updated_by: req.user.id_user, updated_at: new Date() }, { transaction });
          updated += 1;
        }
      }
    });
    await AuditService.logCreate({
      tabel: "aset_model_3d_object",
      id_referensi: model.id_model_3d,
      data_baru: { created, updated, failed: failedRows.length },
      keterangan: `Impor CSV atribut objek model 3D versi ${model.version}: ${created} baru, ${updated} diperbarui, ${failedRows.length} gagal`,
      user_id: req.user.id_user,
      req,
    });
    return res.json({
      success: true,
      message: `Impor selesai: ${created} ditambahkan, ${updated} diperbarui, ${failedRows.length} gagal`,
      data: { total: rows.length, created, updated, failed: failedRows.length, failedRows },
    });
  } catch (error) {
    return res.status(error instanceof Model3dObjectValidationError ? 400 : 500).json({
      success: false,
      error: error.message,
    });
  }
};
