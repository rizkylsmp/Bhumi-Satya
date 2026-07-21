import { readFile } from "node:fs/promises";
import path from "node:path";
import { inspectKmzModel } from "../src/utils/kmzModel.js";
import { convertKmzToGlb } from "../src/utils/model3dConversion.js";
import { createGlbLods } from "../src/utils/glbOptimization.js";
import { createModel3dTileset } from "../src/utils/model3dTileset.js";

const sourcePath = process.argv[2];
if (!sourcePath) {
  console.error("Penggunaan: node scripts/verify-model3d-pipeline.js <file.kmz>");
  process.exit(1);
}

try {
  const kmz = await readFile(path.resolve(sourcePath));
  const manifest = inspectKmzModel(kmz);
  const converted = await convertKmzToGlb(kmz, manifest.modelEntry);
  const lods = await createGlbLods(converted.buffer);
  const model = {
    id_aset: 1,
    id_model_3d: 1,
    version: 1,
    location_lat: manifest.latitude,
    location_long: manifest.longitude,
    altitude_m: manifest.altitudeM,
    heading: manifest.heading,
    tilt: manifest.tilt,
    roll: manifest.roll,
    scale_x: manifest.scaleX,
    scale_y: manifest.scaleY,
    scale_z: manifest.scaleZ,
    converted_public_url: "https://example.invalid/model-high.glb",
    converted_bounds: lods.high.bounds,
    converted_triangle_count: lods.high.triangleCount,
    lod_medium_public_url: lods.medium ? "https://example.invalid/model-medium.glb" : null,
    lod_medium_triangle_count: lods.medium?.triangleCount,
    lod_low_public_url: lods.low ? "https://example.invalid/model-low.glb" : null,
    lod_low_triangle_count: lods.low?.triangleCount,
  };
  const tileset = createModel3dTileset([model]);
  if (!tileset?.root?.content?.uri) throw new Error("Tileset tidak memiliki content model");

  console.log(`File: ${path.basename(sourcePath)}`);
  console.log(`KMZ: ${kmz.length} byte, ${manifest.entryCount} entri, model ${manifest.modelType}`);
  console.log(`Lokasi: ${manifest.latitude}, ${manifest.longitude}`);
  console.log(`GLB tinggi: ${converted.buffer.length} byte, ${lods.high.triangleCount} segitiga`);
  if (lods.medium) console.log(`GLB sedang: ${lods.medium.buffer.length} byte, ${lods.medium.triangleCount} segitiga`);
  if (lods.low) console.log(`GLB ringan: ${lods.low.buffer.length} byte, ${lods.low.triangleCount} segitiga`);
  if (lods.skipped) console.log("LOD tambahan dilewati karena model memiliki kurang dari 1.000 segitiga.");
  console.log(`Bounds: radius ${lods.high.bounds?.radius?.toFixed(3) || "-"} unit`);
  console.log(`Tileset: 3D Tiles ${tileset.asset.version}, LOD awal ${tileset.root.extras?.lod || "spasial"}`);
  console.log("Pipeline model 3D offline berhasil diverifikasi.");
} catch (error) {
  console.error(`Verifikasi pipeline gagal: ${error.message}`);
  process.exit(1);
}
