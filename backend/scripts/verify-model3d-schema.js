import { QueryTypes } from "sequelize";
import sequelize from "../src/config/database.js";

const expectedMigrations = [
  "20260718000001-add-3d-metadata-to-aset.cjs",
  "20260718000002-create-aset-model-3d.cjs",
  "20260718000003-add-conversion-to-aset-model-3d.cjs",
  "20260718000004-add-lod-metadata-to-aset-model-3d.cjs",
];

const expectedAssetColumns = [
  "building_footprint",
  "building_height_m",
  "building_base_elevation_m",
  "building_floors",
  "building_height_source",
  "building_height_quality",
  "model_3d_lod",
  "model_3d_source_crs",
  "model_3d_recorded_at",
  "model_3d_accuracy_m",
];

const expectedModelColumns = [
  "id_model_3d",
  "conversion_status",
  "converted_storage_path",
  "converted_bounds",
  "converted_triangle_count",
  "lod_medium_storage_path",
  "lod_medium_triangle_count",
  "lod_low_storage_path",
  "lod_low_triangle_count",
  "optimization_error",
];

const getColumns = async (tableName) => {
  const rows = await sequelize.query(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = :tableName`,
    { replacements: { tableName }, type: QueryTypes.SELECT },
  );
  return new Set(rows.map((row) => row.column_name));
};

try {
  const migrations = await sequelize.query(
    'SELECT name FROM "SequelizeMeta" WHERE name IN (:names)',
    {
      replacements: { names: expectedMigrations },
      type: QueryTypes.SELECT,
    },
  );
  const applied = new Set(migrations.map((row) => row.name));
  const assetColumns = await getColumns("aset");
  const modelColumns = await getColumns("aset_model_3d");

  const missingMigrations = expectedMigrations.filter((name) => !applied.has(name));
  const missingAssetColumns = expectedAssetColumns.filter((name) => !assetColumns.has(name));
  const missingModelColumns = expectedModelColumns.filter((name) => !modelColumns.has(name));

  console.log(`Migrasi 3D tercatat: ${applied.size}/${expectedMigrations.length}`);
  console.log(`Kolom metadata aset: ${expectedAssetColumns.length - missingAssetColumns.length}/${expectedAssetColumns.length}`);
  console.log(`Kolom katalog model: ${expectedModelColumns.length - missingModelColumns.length}/${expectedModelColumns.length}`);

  if (missingMigrations.length || missingAssetColumns.length || missingModelColumns.length) {
    if (missingMigrations.length) console.log(`Migrasi belum tercatat: ${missingMigrations.join(", ")}`);
    if (missingAssetColumns.length) console.log(`Kolom aset belum ada: ${missingAssetColumns.join(", ")}`);
    if (missingModelColumns.length) console.log(`Kolom model belum ada: ${missingModelColumns.join(", ")}`);
    process.exitCode = 1;
  } else {
    console.log("Skema 3D siap digunakan.");
  }
} catch (error) {
  console.error(`Verifikasi skema 3D gagal: ${error.message}`);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
