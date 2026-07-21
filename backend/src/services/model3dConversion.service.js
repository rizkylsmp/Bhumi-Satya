import crypto from "node:crypto";
import { Op } from "sequelize";
import { AsetModel3d, sequelize } from "../models/index.js";
import AuditService from "./audit.service.js";
import {
  deleteFromSupabase,
  getFileBuffer,
  uploadToSupabase,
} from "../utils/r2Storage.js";
import { convertKmzToGlb } from "../utils/model3dConversion.js";
import { analyzeGlb, createGlbLods } from "../utils/glbOptimization.js";

const serializeForAudit = (model) => {
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

export const claimNextModel3dConversion = async () => sequelize.transaction(
  async (transaction) => {
    const model = await AsetModel3d.findOne({
      where: {
        conversion_status: "pending",
        archived_at: null,
      },
      order: [["updated_at", "ASC"], ["id_model_3d", "ASC"]],
      transaction,
      lock: transaction.LOCK.UPDATE,
      skipLocked: true,
    });
    if (!model) return null;

    await model.update({
      conversion_status: "processing",
      conversion_error: null,
      updated_at: new Date(),
    }, { transaction });
    return model;
  },
);

export const resetStaleModel3dConversions = async (staleMinutes = 30) => {
  const cutoff = new Date(Date.now() - staleMinutes * 60 * 1000);
  const [count] = await AsetModel3d.update({
    conversion_status: "pending",
    conversion_error: "Proses sebelumnya terhenti dan dimasukkan kembali ke antrean",
    updated_at: new Date(),
  }, {
    where: {
      conversion_status: "processing",
      archived_at: null,
      updated_at: { [Op.lt]: cutoff },
    },
  });
  return count;
};

export const processModel3dConversion = async (model) => {
  const oldData = serializeForAudit(model);
  let convertedStoragePath = null;
  const uploadedLodPaths = [];
  try {
    const sourceBuffer = await getFileBuffer(model.storage_path);
    const converted = await convertKmzToGlb(sourceBuffer, model.model_entry);
    const checksum = crypto.createHash("sha256").update(converted.buffer).digest("hex");
    convertedStoragePath = `model-3d/aset-${model.id_aset}/v${model.version}-web-${checksum.slice(0, 12)}.glb`;
    const publicUrl = await uploadToSupabase(
      convertedStoragePath,
      converted.buffer,
      "model/gltf-binary",
    );

    let optimizationError = null;
    let lods;
    try {
      lods = await createGlbLods(converted.buffer);
    } catch (error) {
      optimizationError = String(error.message || "Optimasi GLB gagal").slice(0, 2000);
      lods = {
        high: await analyzeGlb(converted.buffer),
        medium: null,
        low: null,
        skipped: true,
      };
    }

    const uploadLod = async (name, variant) => {
      if (!variant) return null;
      const variantChecksum = crypto.createHash("sha256").update(variant.buffer).digest("hex");
      const storagePath = `model-3d/aset-${model.id_aset}/v${model.version}-lod-${name}-${variantChecksum.slice(0, 12)}.glb`;
      const variantUrl = await uploadToSupabase(storagePath, variant.buffer, "model/gltf-binary");
      uploadedLodPaths.push(storagePath);
      return {
        storagePath,
        publicUrl: variantUrl,
        sizeBytes: variant.buffer.length,
        checksum: variantChecksum,
        triangleCount: variant.triangleCount,
      };
    };

    let mediumLod = null;
    let lowLod = null;
    if (!optimizationError) {
      try {
        mediumLod = await uploadLod("medium", lods.medium);
        lowLod = await uploadLod("low", lods.low);
      } catch (error) {
        optimizationError = String(error.message || "Unggah LOD gagal").slice(0, 2000);
        await Promise.all(uploadedLodPaths.map((path) => deleteFromSupabase(path).catch(() => {})));
        uploadedLodPaths.length = 0;
        mediumLod = null;
        lowLod = null;
      }
    }

    const previousConvertedPath = model.converted_storage_path;
    const previousMediumPath = model.lod_medium_storage_path;
    const previousLowPath = model.lod_low_storage_path;
    await model.update({
      conversion_status: "ready",
      converted_storage_path: convertedStoragePath,
      converted_public_url: publicUrl,
      converted_mime_type: "model/gltf-binary",
      converted_size_bytes: converted.buffer.length,
      converted_checksum_sha256: checksum,
      converted_at: new Date(),
      conversion_error: null,
      converted_bounds: lods.high.bounds,
      converted_triangle_count: lods.high.triangleCount,
      lod_medium_storage_path: mediumLod?.storagePath || null,
      lod_medium_public_url: mediumLod?.publicUrl || null,
      lod_medium_size_bytes: mediumLod?.sizeBytes || null,
      lod_medium_checksum_sha256: mediumLod?.checksum || null,
      lod_medium_triangle_count: mediumLod?.triangleCount || null,
      lod_low_storage_path: lowLod?.storagePath || null,
      lod_low_public_url: lowLod?.publicUrl || null,
      lod_low_size_bytes: lowLod?.sizeBytes || null,
      lod_low_checksum_sha256: lowLod?.checksum || null,
      lod_low_triangle_count: lowLod?.triangleCount || null,
      optimized_at: new Date(),
      optimization_error: optimizationError,
      updated_at: new Date(),
    });

    const retainedPaths = new Set([convertedStoragePath, mediumLod?.storagePath, lowLod?.storagePath]);
    [previousConvertedPath, previousMediumPath, previousLowPath]
      .filter((path) => path && !retainedPaths.has(path))
      .forEach((path) => {
        deleteFromSupabase(path).catch((error) => {
          console.error("Failed deleting replaced GLB derivative:", error.message);
        });
      });

    await AuditService.logUpdate({
      tabel: "aset_model_3d",
      id_referensi: model.id_model_3d,
      data_lama: oldData,
      data_baru: serializeForAudit(model),
      keterangan: `Worker mengonversi model 3D aset ${model.id_aset} versi ${model.version} ke GLB${mediumLod || lowLod ? " dan LOD turunan" : ""}`,
      user_id: model.uploaded_by,
      req: null,
    });
    return model;
  } catch (error) {
    if (convertedStoragePath) {
      try {
        await deleteFromSupabase(convertedStoragePath);
      } catch (cleanupError) {
        console.error("Failed cleaning converted GLB:", cleanupError.message);
      }
    }
    await Promise.all(uploadedLodPaths.map((path) => deleteFromSupabase(path).catch(() => {})));
    await model.update({
      conversion_status: "failed",
      conversion_error: String(error.message || "Konversi gagal").slice(0, 2000),
      updated_at: new Date(),
    });
    throw error;
  }
};

export const processNextModel3dConversion = async () => {
  const model = await claimNextModel3dConversion();
  if (!model) return { processed: false };
  try {
    await processModel3dConversion(model);
    return { processed: true, success: true, modelId: model.id_model_3d };
  } catch (error) {
    return {
      processed: true,
      success: false,
      modelId: model.id_model_3d,
      error: error.message,
    };
  }
};
