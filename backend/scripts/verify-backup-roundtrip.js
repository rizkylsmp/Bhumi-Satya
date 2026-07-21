import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

dotenv.config({
  path: path.join(
    backendRoot,
    process.env.NODE_ENV === "production" ? ".env.production" : ".env",
  ),
  override: false,
});

const backupPath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : null;

if (!backupPath || !fs.existsSync(backupPath)) {
  console.error(
    "Usage: node scripts/verify-backup-roundtrip.js <backup.json>",
  );
  process.exit(1);
}

const sslEnabled = String(process.env.DB_SSL || "").toLowerCase() === "true";
const connectionConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

if (sslEnabled) {
  connectionConfig.ssl = { rejectUnauthorized: false };
}

const quoteIdent = (identifier) =>
  `"${String(identifier).replaceAll('"', '""')}"`;

const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));
if (!Array.isArray(backup.tables)) {
  throw new Error("Backup tidak memiliki array tables.");
}

const client = new Client(connectionConfig);
const results = [];

try {
  await client.connect();
  await client.query("BEGIN");

  for (let index = 0; index < backup.tables.length; index += 1) {
    const table = backup.tables[index];
    const schema = table.schema || "public";
    const liveTable = `${quoteIdent(schema)}.${quoteIdent(table.name)}`;
    const tempTableName = `epic0_restore_${index + 1}`;
    const tempTable = `pg_temp.${quoteIdent(tempTableName)}`;
    const columns = table.columns.map((column) => column.column_name);

    if (!columns.length) {
      throw new Error(`${schema}.${table.name} tidak memiliki metadata kolom.`);
    }

    const columnList = columns.map(quoteIdent).join(", ");
    await client.query(
      `CREATE TEMP TABLE ${quoteIdent(tempTableName)}
       (LIKE ${liveTable} INCLUDING DEFAULTS INCLUDING GENERATED
        INCLUDING IDENTITY INCLUDING CONSTRAINTS)
       ON COMMIT DROP`,
    );

    if (table.rows.length) {
      await client.query(
        `INSERT INTO ${tempTable} (${columnList})
         SELECT ${columnList}
         FROM json_populate_recordset(NULL::${liveTable}, $1::json)`,
        [JSON.stringify(table.rows)],
      );
    }

    const restored = await client.query(
      `SELECT count(*)::int AS count FROM ${tempTable}`,
    );
    const restoredCount = restored.rows[0].count;

    if (restoredCount !== table.row_count || restoredCount !== table.rows.length) {
      throw new Error(
        `${schema}.${table.name}: expected ${table.row_count}, restored ${restoredCount}.`,
      );
    }

    results.push({
      table: `${schema}.${table.name}`,
      expected: table.row_count,
      restored: restoredCount,
      status: "ok",
    });
  }

  await client.query("ROLLBACK");
  console.log(
    JSON.stringify(
      {
        verified_at: new Date().toISOString(),
        backup: path.basename(backupPath),
        isolation: "temporary tables inside rolled-back transaction",
        tables: results,
        status: "passed",
      },
      null,
      2,
    ),
  );
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  console.error(`Backup roundtrip verification failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
