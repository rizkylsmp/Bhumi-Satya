import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Op } from "sequelize";
import {
  Aset,
  AsetModel3d,
  Riwayat,
  User,
  sequelize,
} from "../src/models/index.js";
import { processModel3dConversion } from "../src/services/model3dConversion.service.js";
import { inspectKmzModel } from "../src/utils/kmzModel.js";
import { createModel3dTileset } from "../src/utils/model3dTileset.js";
import {
  deleteFromSupabase,
  getFileBuffer,
  uploadToSupabase,
} from "../src/utils/r2Storage.js";

const sourcePath = process.argv[2];
const confirmed = process.argv.includes("--confirm-external-cleanup");
if (!sourcePath || !confirmed) {
  console.error("Penggunaan: node scripts/verify-model3d-external-e2e.js <file.kmz> --confirm-external-cleanup");
  process.exit(1);
}

const checksum = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");
const uploadedPaths = new Set();
let model = null;
let temporaryAsset = null;
let temporaryUser = null;

try {
  let user = await User.findOne({ attributes: ["id_user"], order: [["id_user", "ASC"]] });
  if (!user) {
    const identity = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    temporaryUser = await User.create({
      username: `model3d-e2e-${identity}`,
      password: crypto.randomBytes(24).toString("hex"),
      role: "admin",
      nama_lengkap: "Pengguna Sementara Uji Model 3D",
      status_aktif: false,
    });
    user = temporaryUser;
  }

  let asset = await Aset.findOne({ attributes: ["id_aset"], order: [["id_aset", "ASC"]] });
  if (!asset) {
    temporaryAsset = await Aset.create({
      kode_aset: `MODEL3D-E2E-${Date.now()}`,
      nama_aset: "Aset Sementara Uji Model 3D",
      lokasi: "Data sementara untuk pengujian; akan dihapus otomatis",
      koordinat_lat: -7.783186,
      koordinat_long: 110.343751,
      sumber: "BPN",
      created_by: user.id_user,
    });
    asset = temporaryAsset;
  }

  const kmz = await readFile(path.resolve(sourcePath));
  const manifest = inspectKmzModel(kmz);
  const sourceChecksum = checksum(kmz);
  const latestVersion = Number(await AsetModel3d.max("version", {
    where: { id_aset: asset.id_aset },
  })) || 0;
  const version = latestVersion + 1;
  const runId = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const sourceStoragePath = `model-3d/e2e-tests/${runId}/source.kmz`;
  const sourceUrl = await uploadToSupabase(
    sourceStoragePath,
    kmz,
    "application/vnd.google-earth.kmz",
  );
  uploadedPaths.add(sourceStoragePath);

  model = await AsetModel3d.create({
    id_aset: asset.id_aset,
    version,
    is_active: false,
    status: "ready",
    format: manifest.format,
    original_name: path.basename(sourcePath),
    storage_path: sourceStoragePath,
    public_url: sourceUrl,
    mime_type: "application/vnd.google-earth.kmz",
    file_size_bytes: kmz.length,
    checksum_sha256: sourceChecksum,
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
    manifest,
    uploaded_by: user.id_user,
  });

  await processModel3dConversion(model);
  await model.reload();
  [
    model.converted_storage_path,
    model.lod_medium_storage_path,
    model.lod_low_storage_path,
  ].filter(Boolean).forEach((value) => uploadedPaths.add(value));

  const variants = [
    ["sumber", model.storage_path, model.checksum_sha256],
    ["tinggi", model.converted_storage_path, model.converted_checksum_sha256],
    ["sedang", model.lod_medium_storage_path, model.lod_medium_checksum_sha256],
    ["ringan", model.lod_low_storage_path, model.lod_low_checksum_sha256],
  ].filter(([, storagePath]) => storagePath);
  for (const [name, storagePath, expectedChecksum] of variants) {
    const downloaded = await getFileBuffer(storagePath);
    if (checksum(downloaded) !== expectedChecksum) {
      throw new Error(`Checksum file ${name} berbeda setelah diunduh dari storage`);
    }
  }

  const tileset = createModel3dTileset([model.toJSON()]);
  if (!tileset?.root?.content?.uri || tileset.asset.version !== "1.1") {
    throw new Error("Tileset hasil integrasi tidak valid");
  }

  console.log(`Aset relasi sementara: ${asset.id_aset}`);
  console.log(`Record model sementara: ${model.id_model_3d}`);
  console.log(`Storage terverifikasi: ${variants.length} file`);
  console.log(`GLB tinggi: ${model.converted_size_bytes} byte, ${model.converted_triangle_count} segitiga`);
  console.log(`LOD sedang: ${model.lod_medium_size_bytes || 0} byte, ${model.lod_medium_triangle_count || 0} segitiga`);
  console.log(`LOD ringan: ${model.lod_low_size_bytes || 0} byte, ${model.lod_low_triangle_count || 0} segitiga`);
  console.log(`Tileset: ${tileset.asset.version}, LOD awal ${tileset.root.extras?.lod || "spasial"}`);
  console.log("Uji eksternal berhasil; pembersihan artefak sementara dimulai.");
} catch (error) {
  console.error(`Uji eksternal gagal: ${error.message}`);
  process.exitCode = 1;
} finally {
  if (model) {
    await model.reload().catch(() => {});
    [
      model.storage_path,
      model.converted_storage_path,
      model.lod_medium_storage_path,
      model.lod_low_storage_path,
    ].filter(Boolean).forEach((value) => uploadedPaths.add(value));
  }

  const cleanupErrors = [];
  for (const storagePath of uploadedPaths) {
    try {
      await deleteFromSupabase(storagePath);
    } catch (error) {
      cleanupErrors.push(`${storagePath}: ${error.message}`);
    }
  }
  if (model) {
    await Riwayat.destroy({
      where: {
        tabel: "aset_model_3d",
        id_referensi: model.id_model_3d,
        keterangan: { [Op.like]: "Worker mengonversi model 3D%" },
      },
    }).catch((error) => cleanupErrors.push(`audit: ${error.message}`));
    await model.destroy().catch((error) => cleanupErrors.push(`record: ${error.message}`));
  }
  if (temporaryAsset) {
    await temporaryAsset.destroy().catch((error) => cleanupErrors.push(`aset sementara: ${error.message}`));
  }
  if (temporaryUser) {
    await temporaryUser.destroy().catch((error) => cleanupErrors.push(`user sementara: ${error.message}`));
  }
  await sequelize.close();

  if (cleanupErrors.length) {
    console.error(`Pembersihan belum lengkap: ${cleanupErrors.join("; ")}`);
    process.exitCode = 1;
  } else {
    console.log(`Pembersihan selesai: ${uploadedPaths.size} file storage dan record sementara dihapus.`);
  }
}
