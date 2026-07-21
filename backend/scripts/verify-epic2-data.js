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

const client = new Client(connectionConfig);

const assertEqual = (label, actual, expected) => {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
};

const assertAtLeast = (label, actual, minimum) => {
  if (actual < minimum) {
    throw new Error(`${label}: expected at least ${minimum}, got ${actual}`);
  }
};

try {
  await client.connect();

  const counts = (
    await client.query(`
      SELECT
        (SELECT COUNT(*)::int FROM aset) AS aset,
        (SELECT COUNT(*)::int FROM pusat_data) AS pusat_data,
        (SELECT COUNT(*)::int FROM aset_sumber) AS aset_sumber,
        (SELECT COUNT(*)::int FROM aset_reconciliation) AS aset_reconciliation,
        (
          SELECT COUNT(*)::int
          FROM sewa_aset s
          LEFT JOIN aset a ON a.id_aset = s.id_aset
          WHERE s.id_aset IS NOT NULL AND a.id_aset IS NULL
        ) AS orphan_sewa_aset
    `)
  ).rows[0];

  const sourceTables = (
    await client.query(`
      SELECT source_table, COUNT(*)::int AS count
      FROM aset_sumber
      GROUP BY source_table
      ORDER BY source_table
    `)
  ).rows;

  const reconciliationStatuses = (
    await client.query(`
      SELECT status, COUNT(*)::int AS count
      FROM aset_reconciliation
      GROUP BY status
      ORDER BY status
    `)
  ).rows;

  const asetStatuses = (
    await client.query(`
      SELECT reconciliation_status, COUNT(*)::int AS count
      FROM aset
      GROUP BY reconciliation_status
      ORDER BY reconciliation_status
    `)
  ).rows;

  const coverage = (
    await client.query(`
      SELECT
        COUNT(DISTINCT id_aset)::int AS reconciled_aset,
        COUNT(DISTINCT id_pusat_data)::int AS reconciled_pusat_data,
        COUNT(*) FILTER (WHERE id_pusat_data IS NULL)::int AS missing_pusat_data
      FROM aset_reconciliation
    `)
  ).rows[0];

  const filledSafeFields = (
    await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE nomor_hak IS NOT NULL AND trim(nomor_hak) <> '')::int AS nomor_hak,
        COUNT(*) FILTER (WHERE surat_ukur IS NOT NULL AND trim(surat_ukur) <> '')::int AS surat_ukur,
        COUNT(*) FILTER (WHERE pemilik_pertama IS NOT NULL AND trim(pemilik_pertama) <> '')::int AS pemilik_pertama,
        COUNT(*) FILTER (WHERE pemilik_akhir IS NOT NULL AND trim(pemilik_akhir) <> '')::int AS pemilik_akhir
      FROM aset
      WHERE reconciliation_status IN ('cocok', 'konflik')
    `)
  ).rows[0];

  const sourceTableCounts = Object.fromEntries(
    sourceTables.map((row) => [row.source_table, row.count]),
  );
  const reconciliationStatusCounts = Object.fromEntries(
    reconciliationStatuses.map((row) => [row.status, row.count]),
  );

  assertEqual("aset row count", counts.aset, 1962);
  assertEqual("pusat_data row count", counts.pusat_data, 481);
  assertEqual("sewa_aset orphan count", counts.orphan_sewa_aset, 0);
  assertEqual("aset_sumber aset rows", sourceTableCounts.aset || 0, 1962);
  assertEqual("aset_sumber safe pusat_data rows", sourceTableCounts.pusat_data || 0, 183);
  assertEqual("aset_reconciliation rows", counts.aset_reconciliation, 843);
  assertEqual("reconciled distinct pusat_data", coverage.reconciled_pusat_data, 481);
  assertEqual("reconciliation missing pusat_data", coverage.missing_pusat_data, 0);
  assertEqual("reconciliation cocok rows", reconciliationStatusCounts.cocok || 0, 182);
  assertEqual("reconciliation konflik rows", reconciliationStatusCounts.konflik || 0, 661);
  assertAtLeast("filled nomor_hak", filledSafeFields.nomor_hak, 183);
  assertAtLeast("filled pemilik_pertama", filledSafeFields.pemilik_pertama, 183);
  assertAtLeast("filled pemilik_akhir", filledSafeFields.pemilik_akhir, 183);

  console.log(
    JSON.stringify(
      {
        ok: true,
        counts,
        sourceTables,
        reconciliationStatuses,
        asetStatuses,
        coverage,
        filledSafeFields,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
