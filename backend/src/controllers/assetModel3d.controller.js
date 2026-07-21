import crypto from "node:crypto";
import { Aset, AsetModel3d, sequelize } from "../models/index.js";
import AuditService from "../services/audit.service.js";
import {
  deleteFromSupabase,
  getFileBuffer,
  uploadToSupabase,
} from "../utils/r2Storage.js";
import {
  assessKmzModelLocation,
  inspectKmzModel,
  KmzValidationError,
} from "../utils/kmzModel.js";
import {
  Model3dRoomValidationError,
  normalizeModel3dRooms,
} from "../utils/model3dRooms.js";
import {
  Model3dMetadataValidationError,
  normalizeModel3dMetadata,
} from "../utils/model3dMetadata.js";

const serializeModel = (model) => {
  const value = model.toJSON ? model.toJSON() : model;
  const {
    storage_path: storagePath,
    converted_storage_path: convertedStoragePath,
    lod_medium_storage_path: lodMediumStoragePath,
    lod_low_storage_path: lodLowStoragePath,
    ...safeValue
  } = value;
  return {
    ...safeValue,
    storage_filename: storagePath,
    converted_storage_filename: convertedStoragePath,
    lod_medium_storage_filename: lodMediumStoragePath,
    lod_low_storage_filename: lodLowStoragePath,
  };
};

export const list = async (req, res) => {
  try {
    const asset = await Aset.findByPk(req.params.id, { attributes: ["id_aset"] });
    if (!asset) return res.status(404).json({ success: false, error: "Aset tidak ditemukan" });
    const models = await AsetModel3d.findAll({
      where: { id_aset: asset.id_aset },
      order: [["version", "DESC"]],
    });
    return res.json({ success: true, data: models.map(serializeModel) });
  } catch (error) {
    console.error("Error listing asset 3D models:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const makeDownloadName = (model, variant) => {
  if (variant === "glb") {
    const baseName = String(model.original_name || `model-${model.id_model_3d}`)
      .replace(/\.kmz$/i, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_");
    return `${baseName}-v${model.version}.glb`;
  }
  return String(model.original_name || `model-${model.id_model_3d}.kmz`)
    .replace(/[^a-zA-Z0-9._-]/g, "_");
};

export const download = async (req, res) => {
  try {
    const model = await AsetModel3d.findOne({
      where: {
        id_model_3d: req.params.modelId,
        id_aset: req.params.id,
      },
    });
    if (!model) {
      return res.status(404).json({ success: false, error: "Versi model 3D tidak ditemukan" });
    }

    const variant = req.query.variant === "glb" ? "glb" : "source";
    if (variant === "glb" && (!model.converted_storage_path || model.conversion_status !== "ready")) {
      return res.status(409).json({ success: false, error: "File GLB belum tersedia" });
    }

    const storagePath = variant === "glb"
      ? model.converted_storage_path
      : model.storage_path;
    const mimeType = variant === "glb"
      ? (model.converted_mime_type || "model/gltf-binary")
      : (model.mime_type || "application/vnd.google-earth.kmz");
    const filename = makeDownloadName(model, variant);
    const buffer = await getFileBuffer(storagePath);

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Length", buffer.length);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );
    return res.send(buffer);
  } catch (error) {
    console.error("Error downloading asset 3D model:", error);
    return res.status(500).json({ success: false, error: "Gagal mengunduh file model 3D" });
  }
};

export const upload = async (req, res) => {
  let uploadedStoragePath = null;
  try {
    const asset = await Aset.findByPk(req.params.id);
    if (!asset) return res.status(404).json({ success: false, error: "Aset tidak ditemukan" });
    if (!req.file) return res.status(400).json({ success: false, error: "File KMZ diperlukan" });

    const originalName = req.file.originalname || "model.kmz";
    if (!originalName.toLowerCase().endsWith(".kmz")) {
      return res.status(400).json({ success: false, error: "Tahap ini hanya menerima file .kmz" });
    }

    const inspectedManifest = inspectKmzModel(req.file.buffer);
    const locationAssessment = assessKmzModelLocation({
      assetLat: asset.koordinat_lat,
      assetLng: asset.koordinat_long,
      modelLat: inspectedManifest.latitude,
      modelLng: inspectedManifest.longitude,
    });
    const manifest = { ...inspectedManifest, locationAssessment };
    const checksum = crypto.createHash("sha256").update(req.file.buffer).digest("hex");
    const duplicate = await AsetModel3d.findOne({
      where: { id_aset: asset.id_aset, checksum_sha256: checksum, archived_at: null },
    });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        error: `File yang sama sudah tersimpan sebagai versi ${duplicate.version}`,
        data: serializeModel(duplicate),
      });
    }

    const latestVersion = Number(await AsetModel3d.max("version", {
      where: { id_aset: asset.id_aset },
    })) || 0;
    const version = latestVersion + 1;
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    uploadedStoragePath = `model-3d/aset-${asset.id_aset}/v${version}-${Date.now()}-${safeName}`;
    const mimeType = "application/vnd.google-earth.kmz";
    const publicUrl = await uploadToSupabase(
      uploadedStoragePath,
      req.file.buffer,
      mimeType,
    );

    const model = await sequelize.transaction(async (transaction) => {
      await AsetModel3d.update(
        { is_active: false, updated_at: new Date() },
        { where: { id_aset: asset.id_aset, is_active: true }, transaction },
      );
      return AsetModel3d.create({
        id_aset: asset.id_aset,
        version,
        is_active: true,
        status: "ready",
        format: manifest.format,
        original_name: originalName,
        storage_path: uploadedStoragePath,
        public_url: publicUrl,
        mime_type: mimeType,
        file_size_bytes: req.file.size,
        checksum_sha256: checksum,
        conversion_status: "pending",
        kml_entry: manifest.kmlEntry,
        model_entry: manifest.modelEntry,
        model_type: manifest.modelType,
        location_lat: manifest.latitude,
        location_long: manifest.longitude,
        altitude_m: manifest.altitudeM,
        altitude_mode: manifest.altitudeMode,
        heading: manifest.heading,
        tilt: manifest.tilt,
        roll: manifest.roll,
        scale_x: manifest.scaleX,
        scale_y: manifest.scaleY,
        scale_z: manifest.scaleZ,
        entry_count: manifest.entryCount,
        manifest,
        uploaded_by: req.user.id_user,
      }, { transaction });
    });

    await AuditService.logCreate({
      tabel: "aset_model_3d",
      id_referensi: model.id_model_3d,
      data_baru: serializeModel(model),
      keterangan: `Mengunggah model 3D versi ${version} untuk aset ${asset.nama_aset}`,
      user_id: req.user.id_user,
      req,
    });

    return res.status(201).json({
      success: true,
      message: `Model 3D versi ${version} berhasil diunggah`,
      data: serializeModel(model),
    });
  } catch (error) {
    if (uploadedStoragePath) {
      try {
        await deleteFromSupabase(uploadedStoragePath);
      } catch (cleanupError) {
        console.error("Failed cleaning orphaned 3D upload:", cleanupError.message);
      }
    }
    console.error("Error uploading asset 3D model:", error);
    return res.status(error instanceof KmzValidationError ? 400 : 500).json({
      success: false,
      error: error.message,
    });
  }
};

export const convert = async (req, res) => {
  try {
    const model = await AsetModel3d.findOne({
      where: {
        id_model_3d: req.params.modelId,
        id_aset: req.params.id,
        archived_at: null,
      },
    });
    if (!model) return res.status(404).json({ success: false, error: "Versi model 3D tidak ditemukan" });
    if (model.conversion_status === "ready" && model.converted_public_url) {
      return res.json({ success: true, message: "GLB sudah tersedia", data: serializeModel(model) });
    }
    if (["pending", "processing"].includes(model.conversion_status)) {
      return res.status(202).json({
        success: true,
        message: model.conversion_status === "processing"
          ? "Model sedang dikonversi oleh worker"
          : "Model sudah berada dalam antrean konversi",
        data: serializeModel(model),
      });
    }

    const oldData = serializeModel(model);
    await model.update({
      conversion_status: "pending",
      conversion_error: null,
      updated_at: new Date(),
    });
    await AuditService.logUpdate({
      tabel: "aset_model_3d",
      id_referensi: model.id_model_3d,
      data_lama: oldData,
      data_baru: serializeModel(model),
      keterangan: `Memasukkan ulang konversi model 3D aset ${model.id_aset} versi ${model.version} ke antrean`,
      user_id: req.user.id_user,
      req,
    });
    return res.status(202).json({
      success: true,
      message: "Model dimasukkan ke antrean konversi",
      data: serializeModel(model),
    });
  } catch (error) {
    console.error("Error queueing asset 3D model:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const activate = async (req, res) => {
  try {
    const model = await AsetModel3d.findOne({
      where: { id_model_3d: req.params.modelId, id_aset: req.params.id, archived_at: null },
    });
    if (!model) return res.status(404).json({ success: false, error: "Versi model 3D tidak ditemukan" });
    await sequelize.transaction(async (transaction) => {
      await AsetModel3d.update(
        { is_active: false, updated_at: new Date() },
        { where: { id_aset: model.id_aset, is_active: true }, transaction },
      );
      await model.update({ is_active: true, updated_at: new Date() }, { transaction });
    });
    return res.json({ success: true, data: serializeModel(model) });
  } catch (error) {
    console.error("Error activating asset 3D model:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const updateRooms = async (req, res) => {
  try {
    const model = await AsetModel3d.findOne({
      where: {
        id_model_3d: req.params.modelId,
        id_aset: req.params.id,
        archived_at: null,
      },
    });
    if (!model) {
      return res.status(404).json({ success: false, error: "Versi model 3D tidak ditemukan" });
    }

    const rooms = normalizeModel3dRooms(req.body?.rooms);
    const oldData = serializeModel(model);
    const currentManifest = model.manifest && typeof model.manifest === "object"
      ? model.manifest
      : {};
    await model.update({
      manifest: { ...currentManifest, rooms },
      updated_at: new Date(),
    });

    await AuditService.logUpdate({
      tabel: "aset_model_3d",
      id_referensi: model.id_model_3d,
      data_lama: oldData,
      data_baru: serializeModel(model),
      keterangan: `Memperbarui ${rooms.length} ruang pada model 3D aset ${model.id_aset} versi ${model.version}`,
      user_id: req.user.id_user,
      req,
    });

    return res.json({
      success: true,
      message: "Daftar ruang 3D berhasil disimpan",
      data: serializeModel(model),
    });
  } catch (error) {
    console.error("Error updating asset 3D rooms:", error);
    return res.status(error instanceof Model3dRoomValidationError ? 400 : 500).json({
      success: false,
      error: error.message,
    });
  }
};

export const updateMetadata = async (req, res) => {
  try {
    const model = await AsetModel3d.findOne({
      where: {
        id_model_3d: req.params.modelId,
        id_aset: req.params.id,
        archived_at: null,
      },
    });
    if (!model) {
      return res.status(404).json({ success: false, error: "Versi model 3D tidak ditemukan" });
    }

    const metadata = normalizeModel3dMetadata(req.body);
    const oldData = serializeModel(model);
    const currentManifest = model.manifest && typeof model.manifest === "object"
      ? model.manifest
      : {};
    const {
      display_name: displayName,
      description,
      ...spatialMetadata
    } = metadata;
    const manifest = { ...currentManifest };
    if (Object.hasOwn(metadata, "display_name")) manifest.display_name = displayName;
    if (Object.hasOwn(metadata, "description")) manifest.description = description;

    await model.update({
      ...spatialMetadata,
      manifest,
      updated_at: new Date(),
    });

    await AuditService.logUpdate({
      tabel: "aset_model_3d",
      id_referensi: model.id_model_3d,
      data_lama: oldData,
      data_baru: serializeModel(model),
      keterangan: `Memperbarui metadata model 3D aset ${model.id_aset} versi ${model.version}`,
      user_id: req.user.id_user,
      req,
    });

    return res.json({
      success: true,
      message: "Metadata model 3D berhasil diperbarui",
      data: serializeModel(model),
    });
  } catch (error) {
    console.error("Error updating asset 3D metadata:", error);
    return res.status(error instanceof Model3dMetadataValidationError ? 400 : 500).json({
      success: false,
      error: error.message,
    });
  }
};

export const archive = async (req, res) => {
  try {
    const model = await AsetModel3d.findOne({
      where: {
        id_model_3d: req.params.modelId,
        id_aset: req.params.id,
        archived_at: null,
      },
    });
    if (!model) {
      return res.status(404).json({ success: false, error: "Versi model 3D tidak ditemukan" });
    }

    const oldData = serializeModel(model);
    let replacement = null;
    await sequelize.transaction(async (transaction) => {
      const wasActive = model.is_active;
      await model.update({
        is_active: false,
        status: "archived",
        archived_at: new Date(),
        updated_at: new Date(),
      }, { transaction });

      if (wasActive) {
        replacement = await AsetModel3d.findOne({
          where: { id_aset: model.id_aset, archived_at: null },
          order: [["version", "DESC"]],
          transaction,
        });
        if (replacement) {
          await replacement.update({ is_active: true, updated_at: new Date() }, { transaction });
        }
      }
    });

    await AuditService.logUpdate({
      tabel: "aset_model_3d",
      id_referensi: model.id_model_3d,
      data_lama: oldData,
      data_baru: serializeModel(model),
      keterangan: `Mengarsipkan model 3D aset ${model.id_aset} versi ${model.version}`,
      user_id: req.user.id_user,
      req,
    });

    return res.json({
      success: true,
      message: `Model versi ${model.version} berhasil diarsipkan`,
      data: serializeModel(model),
      activated_model_id: replacement?.id_model_3d || null,
    });
  } catch (error) {
    console.error("Error archiving asset 3D model:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
