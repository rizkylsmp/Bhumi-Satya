import crypto from "node:crypto";
import { Op } from "sequelize";
import {
  Aset,
  Aset3dCatalog,
  AsetModel3d,
  sequelize,
} from "../models/index.js";
import AuditService from "../services/audit.service.js";
import { processModel3dConversion } from "../services/model3dConversion.service.js";
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
import {
  Model3dGovernanceValidationError,
  normalizeModel3dReview,
} from "../utils/model3dGovernance.js";
import { analyzeGlb } from "../utils/glbOptimization.js";
import {
  contentTypeFor3dTile,
  inspectThreeDTilesPackage,
  ThreeDTilesPackageValidationError,
} from "../utils/threeDTilesPackage.js";

class ModelUploadValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ModelUploadValidationError";
  }
}

const MODEL_LODS = new Set([
  "LOD1",
  "LOD2",
  "LOD2.5",
  "LOD3",
  "LOD4",
  "GAUSSIAN_SPLATTING",
]);

const normalizeModelLod = (value) => {
  const lod = String(value || "").trim().toUpperCase();
  if (!MODEL_LODS.has(lod)) {
    throw new ModelUploadValidationError("Level of Detail model tidak valid");
  }
  return lod;
};

const collectCoordinatePairs = (value, pairs = []) => {
  if (!Array.isArray(value)) return pairs;
  if (
    value.length >= 2
    && Number.isFinite(Number(value[0]))
    && Number.isFinite(Number(value[1]))
  ) {
    pairs.push([Number(value[0]), Number(value[1])]);
    return pairs;
  }
  value.forEach((entry) => collectCoordinatePairs(entry, pairs));
  return pairs;
};

const parseCoordinate = (value, min, max) => {
  if (
    value === null
    || value === undefined
    || (typeof value === "string" && value.trim() === "")
  ) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max
    ? parsed
    : null;
};

const resolveAssetLocation = (asset) => {
  const latitude = parseCoordinate(asset.koordinat_lat, -90, 90);
  const longitude = parseCoordinate(asset.koordinat_long, -180, 180);
  if (latitude !== null && longitude !== null) {
    return { latitude, longitude };
  }

  const spatialValue = asset.polygon_bidang;
  let geometry = spatialValue;
  if (typeof geometry === "string") {
    try {
      geometry = JSON.parse(geometry);
    } catch {
      geometry = null;
    }
  }
  const pairs = collectCoordinatePairs(geometry?.coordinates || geometry);
  if (pairs.length === 0) return { latitude: null, longitude: null };
  return {
    longitude: pairs.reduce((sum, pair) => sum + pair[0], 0) / pairs.length,
    latitude: pairs.reduce((sum, pair) => sum + pair[1], 0) / pairs.length,
  };
};

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
    const kode3d = String(req.query?.kode_3d || "").trim();
    const models = await AsetModel3d.findAll({
      where: {
        id_aset: asset.id_aset,
        ...(kode3d ? { kode_3d: kode3d } : {}),
      },
      order: [["lod", "ASC"], ["version", "DESC"]],
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
    if (variant === "glb" && String(model.format).toUpperCase() === "3DTILES") {
      return res.status(400).json({
        success: false,
        error: "Paket 3D Tiles diunduh sebagai ZIP sumber, bukan GLB",
      });
    }
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
  const uploadedStoragePaths = [];
  try {
    const asset = await Aset.findByPk(req.params.id);
    if (!asset) return res.status(404).json({ success: false, error: "Aset tidak ditemukan" });
    const kode3d = String(req.body?.kode_3d || "").trim();
    if (!kode3d) {
      return res.status(400).json({ success: false, error: "Kode 3D wajib disertakan" });
    }
    const catalog = await Aset3dCatalog.findOne({
      where: { kode_3d: kode3d, id_aset: asset.id_aset },
    });
    if (!catalog) {
      return res.status(409).json({
        success: false,
        error: "Kode bangunan 3D tidak ditemukan pada bidang yang dipilih",
      });
    }
    if (!req.file) return res.status(400).json({ success: false, error: "File KMZ, GLB, atau ZIP 3D Tiles diperlukan" });
    const lod = normalizeModelLod(req.body?.lod);

    const originalName = req.file.originalname || "model.glb";
    const extension = originalName.split(".").pop()?.toLowerCase();
    if (!["kmz", "glb", "zip"].includes(extension)) {
      throw new ModelUploadValidationError("File model harus berformat KMZ, GLB, atau ZIP 3D Tiles");
    }

    const assetLocation = resolveAssetLocation(asset);
    let manifest;
    let packageFiles = null;
    if (extension === "kmz") {
      const inspectedManifest = inspectKmzModel(req.file.buffer);
      const locationAssessment = assessKmzModelLocation({
        assetLat: assetLocation.latitude,
        assetLng: assetLocation.longitude,
        modelLat: inspectedManifest.latitude,
        modelLng: inspectedManifest.longitude,
      });
      manifest = { ...inspectedManifest, locationAssessment };
    } else if (extension === "glb") {
      if (!Number.isFinite(assetLocation.latitude) || !Number.isFinite(assetLocation.longitude)) {
        throw new ModelUploadValidationError(
          "GLB tidak menyimpan koordinat peta. Lengkapi koordinat atau geometri spasial aset terlebih dahulu.",
        );
      }
      let analysis;
      try {
        analysis = await analyzeGlb(req.file.buffer);
      } catch {
        throw new ModelUploadValidationError("Isi file GLB tidak valid atau tidak dapat dibaca");
      }
      manifest = {
        format: "GLB",
        modelEntry: originalName,
        modelType: "GLB",
        latitude: assetLocation.latitude,
        longitude: assetLocation.longitude,
        altitudeM: 0,
        altitudeMode: "relativeToGround",
        heading: 0,
        tilt: 0,
        roll: 0,
        scaleX: 1,
        scaleY: 1,
        scaleZ: 1,
        entryCount: 1,
        source: "direct-glb",
        bounds: analysis.bounds,
        triangleCount: analysis.triangleCount,
        locationAssessment: {
          status: "asset-location",
          message: "GLB ditempatkan mengikuti koordinat/geometri spasial aset",
        },
      };
    } else {
      const inspectedPackage = inspectThreeDTilesPackage(req.file.buffer);
      packageFiles = inspectedPackage.files;
      const packageCenter = inspectedPackage.manifest.boundingCenter;
      const hasAssetLocation = Number.isFinite(assetLocation.latitude)
        && Number.isFinite(assetLocation.longitude);
      manifest = {
        ...inspectedPackage.manifest,
        latitude: packageCenter.latitude,
        longitude: packageCenter.longitude,
        altitudeM: packageCenter.altitudeM,
        altitudeMode: "absolute",
        heading: 0,
        tilt: 0,
        roll: 0,
        scaleX: 1,
        scaleY: 1,
        scaleZ: 1,
        locationAssessment: hasAssetLocation
          ? assessKmzModelLocation({
              assetLat: assetLocation.latitude,
              assetLng: assetLocation.longitude,
              modelLat: packageCenter.latitude,
              modelLng: packageCenter.longitude,
            })
          : {
              status: "model-location",
              message: "Fly-to dan penempatan memakai georeferensi paket 3D Tiles",
            },
      };
    }
    const checksum = crypto.createHash("sha256").update(req.file.buffer).digest("hex");
    const duplicate = await AsetModel3d.findOne({
      where: {
        kode_3d: catalog.kode_3d,
        lod,
        checksum_sha256: checksum,
        archived_at: null,
      },
    });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        error: `File yang sama sudah tersimpan sebagai ${lod} versi ${duplicate.version}`,
        data: serializeModel(duplicate),
      });
    }

    const latestVersion = Number(await AsetModel3d.max("version", {
      where: { kode_3d: catalog.kode_3d, lod },
    })) || 0;
    const version = latestVersion + 1;
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const lodPath = lod.toLowerCase().replace(/[^a-z0-9.-]/g, "-");
    const catalogPath = catalog.kode_3d.toLowerCase().replace(/[^a-z0-9.-]/g, "-");
    const uploadedStoragePath = `model-3d/${catalogPath}/${lodPath}/v${version}-${Date.now()}-${safeName}`;
    const mimeType = extension === "glb"
      ? "model/gltf-binary"
      : extension === "zip"
        ? "application/zip"
      : "application/vnd.google-earth.kmz";
    const publicUrl = await uploadToSupabase(
      uploadedStoragePath,
      req.file.buffer,
      mimeType,
    );
    uploadedStoragePaths.push(uploadedStoragePath);

    let packageRootStoragePath = null;
    let packageRootPublicUrl = null;
    const packageStoragePaths = [];
    if (packageFiles) {
      const packagePrefix = `model-3d/${catalogPath}/${lodPath}/v${version}-tiles`;
      const entries = [...packageFiles.entries()];
      for (let index = 0; index < entries.length; index += 12) {
        const batch = entries.slice(index, index + 12);
        const batchResults = await Promise.allSettled(batch.map(async ([entryName, content]) => {
          const storagePath = `${packagePrefix}/${entryName}`;
          const url = await uploadToSupabase(
            storagePath,
            content,
            contentTypeFor3dTile(entryName),
          );
          return { entryName, storagePath, url };
        }));
        const uploadedBatch = batchResults
          .filter((result) => result.status === "fulfilled")
          .map((result) => result.value);
        uploadedBatch.forEach(({ entryName, storagePath, url }) => {
          uploadedStoragePaths.push(storagePath);
          packageStoragePaths.push(storagePath);
          if (entryName === manifest.modelEntry) {
            packageRootStoragePath = storagePath;
            packageRootPublicUrl = url;
          }
        });
        const failedUpload = batchResults.find((result) => result.status === "rejected");
        if (failedUpload) throw failedUpload.reason;
      }
      if (!packageRootStoragePath || !packageRootPublicUrl) {
        throw new ModelUploadValidationError("Gagal memublikasikan tileset.json utama");
      }
    }

    const model = await sequelize.transaction(async (transaction) => {
      return AsetModel3d.create({
        id_aset: asset.id_aset,
        kode_3d: catalog.kode_3d,
        lod,
        version,
        is_active: false,
        status: "ready",
        format: manifest.format,
        original_name: originalName,
        storage_path: uploadedStoragePath,
        public_url: publicUrl,
        mime_type: mimeType,
        file_size_bytes: req.file.size,
        checksum_sha256: checksum,
        conversion_status: packageFiles ? "ready" : "pending",
        converted_storage_path: packageRootStoragePath,
        converted_public_url: packageRootPublicUrl,
        converted_mime_type: packageFiles ? "application/json" : null,
        converted_size_bytes: packageFiles?.get(manifest.modelEntry)?.length || null,
        converted_checksum_sha256: packageFiles
          ? crypto.createHash("sha256").update(packageFiles.get(manifest.modelEntry)).digest("hex")
          : null,
        converted_at: packageFiles ? new Date() : null,
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
        offset_x_m: 0,
        offset_y_m: 0,
        offset_z_m: 0,
        entry_count: manifest.entryCount,
        manifest: packageFiles
          ? { ...manifest, packageStoragePaths }
          : manifest,
        uploaded_by: req.user.id_user,
        review_status: packageFiles ? "needs_review" : "processing",
      }, { transaction });
    });

    await AuditService.logCreate({
      tabel: "aset_model_3d",
      id_referensi: model.id_model_3d,
      data_baru: serializeModel(model),
      keterangan: `Mengunggah model 3D ${lod} versi ${version} untuk aset ${asset.nama_aset}`,
      user_id: req.user.id_user,
      req,
    });

    return res.status(201).json({
      success: true,
      message: packageFiles
        ? `Paket 3D Tiles ${lod} versi ${version} berhasil diunggah dan siap diverifikasi`
        : `Model 3D ${lod} versi ${version} berhasil diunggah`,
      data: serializeModel(model),
    });
  } catch (error) {
    await Promise.allSettled(
      uploadedStoragePaths.map((storagePath) => deleteFromSupabase(storagePath)),
    );
    console.error("Error uploading asset 3D model:", error);
    return res.status(
      error instanceof KmzValidationError
        || error instanceof ModelUploadValidationError
        || error instanceof ThreeDTilesPackageValidationError
        ? 400
        : 500,
    ).json({
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
    if (String(model.format).toUpperCase() === "3DTILES") {
      return res.json({
        success: true,
        message: "Paket 3D Tiles sudah siap dan tidak memerlukan konversi",
        data: serializeModel(model),
      });
    }
    if (model.conversion_status === "ready" && model.converted_public_url) {
      return res.json({ success: true, message: "GLB sudah tersedia", data: serializeModel(model) });
    }
    if (model.conversion_status === "processing") {
      return res.status(202).json({
        success: true,
        message: "Model sedang dikonversi",
        data: serializeModel(model),
      });
    }

    const oldData = serializeModel(model);
    const queueOnly = process.env.MODEL3D_CONVERSION_MODE === "queue";
    await model.update({
      conversion_status: queueOnly ? "pending" : "processing",
      review_status: "processing",
      conversion_error: null,
      updated_at: new Date(),
    });
    await AuditService.logUpdate({
      tabel: "aset_model_3d",
      id_referensi: model.id_model_3d,
      data_lama: oldData,
      data_baru: serializeModel(model),
      keterangan: `${queueOnly ? "Memasukkan" : "Memulai"} konversi model 3D aset ${model.id_aset} versi ${model.version}`,
      user_id: req.user.id_user,
      req,
    });
    if (!queueOnly) {
      await processModel3dConversion(model);
      return res.json({
        success: true,
        message: String(model.format).toUpperCase() === "GLB"
          ? "GLB berhasil divalidasi dan disiapkan untuk peta 3D"
          : "KMZ berhasil dikonversi menjadi GLB",
        data: serializeModel(model),
      });
    }
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
    if (model.conversion_status !== "ready" || !model.converted_public_url) {
      return res.status(409).json({
        success: false,
        error: "Model harus selesai dikonversi sebelum diaktifkan",
      });
    }
    const oldData = serializeModel(model);
    await sequelize.transaction(async (transaction) => {
      await AsetModel3d.update(
        { is_active: false, updated_at: new Date() },
        {
          where: {
            kode_3d: model.kode_3d,
            lod: model.lod,
            is_active: true,
          },
          transaction,
        },
      );
      await model.update({
        is_active: true,
        review_status: "active",
        updated_at: new Date(),
      }, { transaction });
    });
    await AuditService.logUpdate({
      tabel: "aset_model_3d",
      id_referensi: model.id_model_3d,
      data_lama: oldData,
      data_baru: serializeModel(model),
      keterangan: `Mengaktifkan model 3D ${model.lod} aset ${model.id_aset} versi ${model.version}`,
      user_id: req.user.id_user,
      req,
    });
    return res.json({
      success: true,
      message: `Model ${model.lod} berhasil diaktifkan`,
      data: serializeModel(model),
    });
  } catch (error) {
    console.error("Error activating asset 3D model:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const review = async (req, res) => {
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
    const reviewData = normalizeModel3dReview(req.body);
    if (
      reviewData.review_status === "verified"
      && (model.conversion_status !== "ready" || !model.converted_public_url)
    ) {
      return res.status(409).json({
        success: false,
        error: "Model hanya dapat diverifikasi setelah konversi selesai",
      });
    }
    if (reviewData.review_status === "verified") {
      const checklist = model.quality_checklist && typeof model.quality_checklist === "object"
        ? model.quality_checklist
        : {};
      const missingChecks = [
        ["source_documented", "dokumen sumber"],
        ["crs_confirmed", "CRS"],
        ["origin_confirmed", "titik origin"],
        ["unit_confirmed", "satuan"],
        ["geometry_checked", "geometri"],
      ]
        .filter(([key]) => checklist[key] !== true)
        .map(([, label]) => label);
      const missingMetadata = [
        !model.source_data_type ? "jenis sumber" : null,
        !model.source_crs ? "CRS sumber" : null,
        !model.source_unit ? "satuan sumber" : null,
      ].filter(Boolean);
      const missing = [...missingMetadata, ...missingChecks];
      if (missing.length > 0) {
        return res.status(409).json({
          success: false,
          error: `Lengkapi validasi sebelum verifikasi: ${missing.join(", ")}`,
        });
      }
    }

    const oldData = serializeModel(model);
    await model.update({
      ...reviewData,
      is_active: reviewData.review_status === "expired" ? false : model.is_active,
      reviewed_by: req.user.id_user,
      reviewed_at: new Date(),
      updated_at: new Date(),
    });

    await AuditService.logUpdate({
      tabel: "aset_model_3d",
      id_referensi: model.id_model_3d,
      data_lama: oldData,
      data_baru: serializeModel(model),
      keterangan: `Mengubah status verifikasi model 3D aset ${model.id_aset} versi ${model.version} menjadi ${reviewData.review_status}`,
      user_id: req.user.id_user,
      req,
    });

    return res.json({
      success: true,
      message: "Status verifikasi model 3D berhasil diperbarui",
      data: serializeModel(model),
    });
  } catch (error) {
    console.error("Error reviewing asset 3D model:", error);
    return res.status(error instanceof Model3dGovernanceValidationError ? 400 : 500).json({
      success: false,
      error: error.message,
    });
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

export const restore = async (req, res) => {
  try {
    const model = await AsetModel3d.findOne({
      where: {
        id_model_3d: req.params.modelId,
        id_aset: req.params.id,
        status: "archived",
      },
    });
    if (!model || !model.archived_at) {
      return res.status(404).json({
        success: false,
        error: "Versi model 3D yang diarsipkan tidak ditemukan",
      });
    }

    const oldData = serializeModel(model);
    let restoredAsActive = false;
    await sequelize.transaction(async (transaction) => {
      const activeModel = await AsetModel3d.findOne({
        where: {
          kode_3d: model.kode_3d,
          lod: model.lod,
          is_active: true,
          archived_at: null,
        },
        transaction,
      });
      restoredAsActive = !activeModel;
      await model.update({
        is_active: restoredAsActive,
        status: "ready",
        archived_at: null,
        updated_at: new Date(),
      }, { transaction });
    });

    await AuditService.logUpdate({
      tabel: "aset_model_3d",
      id_referensi: model.id_model_3d,
      data_lama: oldData,
      data_baru: serializeModel(model),
      keterangan: `Memulihkan model 3D aset ${model.id_aset} versi ${model.version} dari arsip`,
      user_id: req.user.id_user,
      req,
    });

    return res.json({
      success: true,
      message: restoredAsActive
        ? `Model versi ${model.version} dipulihkan dan dijadikan aktif`
        : `Model versi ${model.version} dipulihkan`,
      data: serializeModel(model),
    });
  } catch (error) {
    console.error("Error restoring archived asset 3D model:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const removePermanent = async (req, res) => {
  try {
    const model = await AsetModel3d.findOne({
      where: {
        id_model_3d: req.params.modelId,
        id_aset: req.params.id,
      },
    });
    if (!model) {
      return res.status(404).json({
        success: false,
        error: "Versi model 3D tidak ditemukan",
      });
    }

    const oldData = serializeModel(model);
    const storagePaths = [...new Set([
      model.storage_path,
      model.converted_storage_path,
      model.lod_medium_storage_path,
      model.lod_low_storage_path,
      ...(Array.isArray(model.manifest?.packageStoragePaths)
        ? model.manifest.packageStoragePaths
        : []),
    ].filter(Boolean))];

    let replacement = null;
    await sequelize.transaction(async (transaction) => {
      if (model.is_active && !model.archived_at) {
        replacement = await AsetModel3d.findOne({
          where: {
            id_model_3d: { [Op.ne]: model.id_model_3d },
            kode_3d: model.kode_3d,
            lod: model.lod,
            archived_at: null,
            conversion_status: "ready",
            converted_public_url: { [Op.ne]: null },
          },
          order: [["version", "DESC"]],
          transaction,
        });
      }

      await model.destroy({ transaction });

      if (replacement) {
        await replacement.update({
          is_active: true,
          review_status: "active",
          updated_at: new Date(),
        }, { transaction });
      }
    });

    const cleanupResults = await Promise.allSettled(
      storagePaths.map((storagePath) => deleteFromSupabase(storagePath)),
    );
    const failedStoragePaths = cleanupResults
      .map((result, index) => (result.status === "rejected" ? storagePaths[index] : null))
      .filter(Boolean);

    try {
      await AuditService.logDelete({
        tabel: "aset_model_3d",
        id_referensi: model.id_model_3d,
        data_lama: oldData,
        keterangan: `Menghapus permanen model 3D aset ${model.id_aset} versi ${model.version}`,
        user_id: req.user.id_user,
        req,
      });
    } catch (auditError) {
      console.error("Failed logging permanent 3D model deletion:", auditError.message);
    }

    if (failedStoragePaths.length > 0) {
      console.error("Failed deleting 3D storage objects:", failedStoragePaths);
    }

    return res.json({
      success: true,
      message: failedStoragePaths.length > 0
        ? `Model versi ${model.version} dihapus permanen, tetapi ${failedStoragePaths.length} file penyimpanan perlu dibersihkan ulang`
        : `Model versi ${model.version} dihapus permanen`,
      data: {
        id_model_3d: model.id_model_3d,
        deleted_file_count: storagePaths.length - failedStoragePaths.length,
        failed_file_count: failedStoragePaths.length,
      },
      activated_model_id: replacement?.id_model_3d || null,
    });
  } catch (error) {
    console.error("Error permanently deleting asset 3D model:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
