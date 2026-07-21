import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";
import Sequelize from "sequelize";
import sequelize from "../src/config/database.js";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationName = process.argv[2];

if (!migrationName || path.basename(migrationName) !== migrationName) {
  console.error("Usage: node scripts/apply-named-migration.js <migration-file.cjs>");
  process.exit(1);
}

const migrationPath = path.resolve(__dirname, "../migrations", migrationName);

try {
  const migration = require(migrationPath);
  const [existing] = await sequelize.query(
    'SELECT 1 FROM "SequelizeMeta" WHERE name = :name LIMIT 1',
    { replacements: { name: migrationName } },
  );

  if (existing.length) {
    console.log(`Migration ${migrationName} sudah tercatat.`);
    await sequelize.close();
    process.exit(0);
  }

  await migration.up(sequelize.getQueryInterface(), Sequelize);
  await sequelize.query('INSERT INTO "SequelizeMeta" (name) VALUES (:name)', {
    replacements: { name: migrationName },
  });

  console.log(`Migration ${migrationName} berhasil diterapkan dan dicatat.`);
  await sequelize.close();
} catch (error) {
  console.error(`Gagal menerapkan ${migrationName}:`, error.message);
  await sequelize.close();
  process.exit(1);
}
