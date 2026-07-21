import sequelize from "../src/config/database.js";

const migrationName = "20260710000001-add-riwayat-audit-context.cjs";

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

try {
  const table = await sequelize.getQueryInterface().describeTable("riwayat");
  assert(table.instansi_pelaku, "Kolom riwayat.instansi_pelaku tidak ditemukan");
  assert(table.changed_fields, "Kolom riwayat.changed_fields tidak ditemukan");

  const [migrationRows] = await sequelize.query(
    'SELECT name FROM "SequelizeMeta" WHERE name = :name',
    { replacements: { name: migrationName } },
  );
  assert(migrationRows.length === 1, "Migrasi audit belum tercatat");

  console.log(
    JSON.stringify(
      {
        success: true,
        table: "riwayat",
        columns: ["instansi_pelaku", "changed_fields"],
        migration: migrationName,
      },
      null,
      2,
    ),
  );
  await sequelize.close();
} catch (error) {
  console.error(error.message);
  await sequelize.close();
  process.exit(1);
}
