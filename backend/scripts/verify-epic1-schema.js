import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Client } = pg;

const createClient = () => {
  const ssl =
    String(process.env.DB_SSL || "").toLowerCase() === "true"
      ? { rejectUnauthorized: false }
      : false;

  if (process.env.DATABASE_URL) {
    return new Client({
      connectionString: process.env.DATABASE_URL,
      ssl,
    });
  }

  return new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl,
  });
};

const expectedAsetColumns = [
  "nomor_hak",
  "surat_ukur",
  "produk",
  "pemilik_pertama",
  "pemilik_akhir",
  "reconciliation_status",
  "reconciliation_notes",
  "verified_at",
  "verified_by",
];

const expectedTables = ["aset_sumber", "aset_reconciliation"];

const expectedIndexes = [
  "idx_aset_reconciliation_status_field",
  "idx_aset_kode_aset_norm",
  "idx_aset_nib_norm_not_null",
  "idx_aset_nomor_sertifikat_norm_not_null",
  "idx_aset_nomor_hak_norm_not_null",
  "idx_pusat_data_kode_aset_norm",
  "idx_pusat_data_nib_norm_not_null",
  "idx_pusat_data_nomor_hak_norm_not_null",
  "idx_aset_sumber_aset",
  "idx_aset_sumber_instansi_aset",
  "idx_aset_sumber_imported_by",
  "idx_aset_sumber_identifier",
  "uq_aset_sumber_source_row",
  "idx_aset_reconciliation_aset_status",
  "idx_aset_reconciliation_status",
  "idx_aset_reconciliation_pusat_data",
  "idx_aset_reconciliation_reviewed_by",
];

const assertAllPresent = (label, expected, actual) => {
  const missing = expected.filter((item) => !actual.includes(item));
  if (missing.length > 0) {
    throw new Error(`${label} missing: ${missing.join(", ")}`);
  }
};

const main = async () => {
  const client = createClient();
  await client.connect();

  try {
    const counts = (
      await client.query(`
        SELECT
          (SELECT COUNT(*)::int FROM aset) AS aset,
          (SELECT COUNT(*)::int FROM pusat_data) AS pusat_data,
          (SELECT COUNT(*)::int FROM aset_sumber) AS aset_sumber,
          (SELECT COUNT(*)::int FROM aset_reconciliation) AS aset_reconciliation
      `)
    ).rows[0];

    const asetColumns = (
      await client.query(
        `
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'aset'
            AND column_name = ANY($1)
          ORDER BY column_name
        `,
        [expectedAsetColumns],
      )
    ).rows.map((row) => row.column_name);

    const tables = (
      await client.query(
        `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = ANY($1)
          ORDER BY table_name
        `,
        [expectedTables],
      )
    ).rows.map((row) => row.table_name);

    const indexes = (
      await client.query(
        `
          SELECT indexname
          FROM pg_indexes
          WHERE schemaname = 'public'
            AND indexname = ANY($1)
          ORDER BY indexname
        `,
        [expectedIndexes],
      )
    ).rows.map((row) => row.indexname);

    const statuses = (
      await client.query(`
        SELECT reconciliation_status, COUNT(*)::int AS count
        FROM aset
        GROUP BY reconciliation_status
        ORDER BY reconciliation_status
      `)
    ).rows;

    assertAllPresent("aset columns", expectedAsetColumns, asetColumns);
    assertAllPresent("tables", expectedTables, tables);
    assertAllPresent("indexes", expectedIndexes, indexes);

    const result = {
      ok: true,
      counts,
      asetColumns,
      tables,
      indexes,
      statuses,
    };

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
