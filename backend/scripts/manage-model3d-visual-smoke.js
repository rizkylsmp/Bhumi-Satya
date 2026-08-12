import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Op } from "sequelize";
import {
  Aset,
  AsetModel3d,
  Notifikasi,
  Riwayat,
  User,
  sequelize,
} from "../src/models/index.js";
import { processModel3dConversion } from "../src/services/model3dConversion.service.js";
import { inspectKmzModel } from "../src/utils/kmzModel.js";
import { deleteFromSupabase, uploadToSupabase } from "../src/utils/r2Storage.js";

const action = process.argv[2];
const sourcePath = process.argv[3];
const isLocalDatabase = ["localhost", "127.0.0.1", "::1"].includes(process.env.DB_HOST);

if (!isLocalDatabase) {
  console.error("Perintah visual smoke hanya boleh dijalankan pada database localhost.");
  await sequelize.close();
  process.exit(1);
}

const removeVisualSmokeData = async () => {
  const users = await User.findAll({
    where: { username: { [Op.like]: "model3d_visual_%" } },
  });
  const assets = await Aset.findAll({
    where: { kode_aset: { [Op.like]: "MODEL3D-VISUAL-%" } },
  });
  const assetIds = assets.map((asset) => asset.id_aset);
  const models = assetIds.length
    ? await AsetModel3d.findAll({ where: { id_aset: { [Op.in]: assetIds } } })
    : [];
  const storagePaths = new Set(models.flatMap((model) => [
    model.storage_path,
    model.converted_storage_path,
    model.lod_medium_storage_path,
    model.lod_low_storage_path,
  ]).filter(Boolean));

  const cleanupErrors = [];
  for (const storagePath of storagePaths) {
    try {
      await deleteFromSupabase(storagePath);
    } catch (error) {
      cleanupErrors.push(`${storagePath}: ${error.message}`);
    }
  }

  const userIds = users.map((user) => user.id_user);
  const modelIds = models.map((model) => model.id_model_3d);
  if (userIds.length || modelIds.length) {
    await Riwayat.destroy({
      where: {
        [Op.or]: [
          ...(userIds.length ? [{ user_id: { [Op.in]: userIds } }] : []),
          ...(modelIds.length ? [{ tabel: "aset_model_3d", id_referensi: { [Op.in]: modelIds } }] : []),
        ],
      },
    });
  }
  if (userIds.length) await Notifikasi.destroy({ where: { user_id: { [Op.in]: userIds } } });
  if (modelIds.length) await AsetModel3d.destroy({ where: { id_model_3d: { [Op.in]: modelIds } } });
  if (assetIds.length) await Aset.destroy({ where: { id_aset: { [Op.in]: assetIds } } });
  if (userIds.length) await User.destroy({ where: { id_user: { [Op.in]: userIds } } });

  if (cleanupErrors.length) throw new Error(`Pembersihan storage belum lengkap: ${cleanupErrors.join("; ")}`);
  console.log(`Visual smoke dibersihkan: ${storagePaths.size} file, ${models.length} model, ${assets.length} aset, ${users.length} user.`);
};

try {
  if (action === "cleanup") {
    await removeVisualSmokeData();
  } else if (action === "create" && sourcePath) {
    const leftovers = await Aset.count({
      where: { kode_aset: { [Op.like]: "MODEL3D-VISUAL-%" } },
    });
    if (leftovers) throw new Error("Data visual smoke lama masih ada. Jalankan aksi cleanup terlebih dahulu.");

    const runId = `${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`;
    const username = `model3d_visual_${runId}`;
    const password = `Visual3D-${crypto.randomBytes(8).toString("hex")}!`;
    const user = await User.create({
      username,
      password,
      role: "admin",
      nama_lengkap: "Admin Uji Visual Model 3D",
      status_aktif: true,
      mfa_enabled: false,
    });
    const kmz = await readFile(path.resolve(sourcePath));
    const manifest = inspectKmzModel(kmz);
    const delta = 0.00025;
    const asset = await Aset.create({
      kode_aset: `MODEL3D-VISUAL-${runId}`,
      nama_aset: "SAMPLE UJI VISUAL MODEL 3D — BUKAN DATA RESMI",
      lokasi: "Lokasi mengikuti koordinat sampel KMZ; bukan aset resmi organisasi",
      koordinat_lat: manifest.latitude,
      koordinat_long: manifest.longitude,
      sumber: "BPN",
      building_footprint: {
        type: "Polygon",
        coordinates: [[
          [manifest.longitude - delta, manifest.latitude - delta],
          [manifest.longitude + delta, manifest.latitude - delta],
          [manifest.longitude + delta, manifest.latitude + delta],
          [manifest.longitude - delta, manifest.latitude + delta],
          [manifest.longitude - delta, manifest.latitude - delta],
        ]],
      },
      building_height_m: 50,
      building_height_source: "model_3d",
      building_height_quality: "estimated",
      model_3d_lod: "LOD1",
      model_3d_source_crs: "EPSG:4326",
      created_by: user.id_user,
    });
    const sourceStoragePath = `model-3d/visual-tests/${runId}/source.kmz`;
    let sourceUploaded = false;
    try {
      const publicUrl = await uploadToSupabase(
        sourceStoragePath,
        kmz,
        "application/vnd.google-earth.kmz",
      );
      sourceUploaded = true;
      const model = await AsetModel3d.create({
        id_aset: asset.id_aset,
        version: 1,
        is_active: true,
        status: "ready",
        format: manifest.format,
        original_name: path.basename(sourcePath),
        storage_path: sourceStoragePath,
        public_url: publicUrl,
        mime_type: "application/vnd.google-earth.kmz",
        file_size_bytes: kmz.length,
        checksum_sha256: crypto.createHash("sha256").update(kmz).digest("hex"),
        conversion_status: "processing",
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
        manifest: { ...manifest, visualSmoke: true, runId },
        uploaded_by: user.id_user,
      });
      await processModel3dConversion(model);
      await model.reload();
      console.log(`VISUAL_SMOKE_USERNAME=${username}`);
      console.log(`VISUAL_SMOKE_PASSWORD=${password}`);
      console.log(`VISUAL_SMOKE_ASSET_ID=${asset.id_aset}`);
      console.log(`VISUAL_SMOKE_MODEL_ID=${model.id_model_3d}`);
      console.log(`VISUAL_SMOKE_STATUS=${model.conversion_status}`);
    } catch (error) {
      if (sourceUploaded) await deleteFromSupabase(sourceStoragePath).catch(() => {});
      throw error;
    }
  } else {
    throw new Error("Penggunaan: manage-model3d-visual-smoke.js create <file.kmz> | cleanup");
  }
} catch (error) {
  console.error(`Visual smoke gagal: ${error.message}`);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
