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

const jsonOutput = process.argv.includes("--json");
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

const normalizeSql = (column) =>
  `NULLIF(regexp_replace(lower(trim(${column}::text)), '[^a-z0-9]+', '', 'g'), '')`;

async function tableExists(table) {
  const result = await client.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = $1
      ) AS present
    `,
    [table],
  );
  return result.rows[0].present;
}

async function getColumns(table) {
  const result = await client.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `,
    [table],
  );
  return new Set(result.rows.map((row) => row.column_name));
}

async function getRowCount(table) {
  const result = await client.query(`SELECT count(*)::int AS count FROM "${table}"`);
  return result.rows[0].count;
}

async function getDistribution(table, column) {
  const result = await client.query(`
    SELECT COALESCE(NULLIF(trim("${column}"::text), ''), '(null)') AS value,
           count(*)::int AS count
    FROM "${table}"
    GROUP BY 1
    ORDER BY count DESC, value
  `);
  return result.rows;
}

async function getNullRates(table, columns, rowCount) {
  if (!rowCount) {
    return columns.map((column) => ({
      column,
      null_count: 0,
      null_percent: 0,
    }));
  }

  const expressions = columns.map(
    (column) =>
      `count(*) FILTER (WHERE "${column}" IS NULL OR trim("${column}"::text) = '')::int AS "${column}"`,
  );
  const result = await client.query(
    `SELECT ${expressions.join(", ")} FROM "${table}"`,
  );

  return columns.map((column) => {
    const nullCount = result.rows[0][column];
    return {
      column,
      null_count: nullCount,
      null_percent: Number(((nullCount / rowCount) * 100).toFixed(2)),
    };
  });
}

async function getDuplicates(table, column) {
  const normalized = normalizeSql(`"${column}"`);
  const result = await client.query(`
    WITH duplicate_groups AS (
      SELECT ${normalized} AS normalized_value,
             count(*)::int AS count
      FROM "${table}"
      WHERE ${normalized} IS NOT NULL
      GROUP BY 1
      HAVING count(*) > 1
    )
    SELECT
      (SELECT count(*)::int FROM duplicate_groups) AS duplicate_values,
      COALESCE(
        (
          SELECT json_agg(sample ORDER BY count DESC, normalized_value)
          FROM (
            SELECT normalized_value, count
            FROM duplicate_groups
            ORDER BY count DESC, normalized_value
            LIMIT 20
          ) AS sample
        ),
        '[]'::json
      ) AS samples
  `);

  return result.rows[0];
}

async function getCandidateMatches() {
  if (!(await tableExists("aset")) || !(await tableExists("pusat_data"))) {
    return {
      total_pairs: 0,
      one_to_one_pairs: 0,
      by_rule: [],
      ambiguous_aset: 0,
      ambiguous_pusat_data: 0,
    };
  }

  const asetColumns = await getColumns("aset");
  const pusatColumns = await getColumns("pusat_data");
  const requiredAset = ["id_aset", "nib", "kode_aset", "nomor_sertifikat"];
  const requiredPusat = ["id_pusat_data", "nib", "kode_aset", "nomor_hak"];

  if (
    requiredAset.some((column) => !asetColumns.has(column)) ||
    requiredPusat.some((column) => !pusatColumns.has(column))
  ) {
    return {
      total_pairs: 0,
      one_to_one_pairs: 0,
      by_rule: [],
      ambiguous_aset: 0,
      ambiguous_pusat_data: 0,
      warning: "Kolom matching belum lengkap pada schema aktif.",
    };
  }

  const result = await client.query(`
    WITH a AS (
      SELECT id_aset,
             ${normalizeSql("nib")} AS nib,
             ${normalizeSql("kode_aset")} AS kode,
             ${normalizeSql("nomor_sertifikat")} AS sertifikat
      FROM aset
    ),
    p AS (
      SELECT id_pusat_data,
             ${normalizeSql("nib")} AS nib,
             ${normalizeSql("kode_aset")} AS kode,
             ${normalizeSql("nomor_hak")} AS sertifikat
      FROM pusat_data
    ),
    pairs AS (
      SELECT a.id_aset,
             p.id_pusat_data,
             CASE
               WHEN a.nib IS NOT NULL AND a.nib = p.nib THEN 'nib'
               WHEN a.kode IS NOT NULL AND a.kode = p.kode THEN 'kode_aset'
               WHEN a.sertifikat IS NOT NULL AND a.sertifikat = p.sertifikat
                 THEN 'nomor_sertifikat'
             END AS matched_by
      FROM a
      JOIN p ON (
        (a.nib IS NOT NULL AND a.nib = p.nib)
        OR (a.kode IS NOT NULL AND a.kode = p.kode)
        OR (a.sertifikat IS NOT NULL AND a.sertifikat = p.sertifikat)
      )
    ),
    aset_degrees AS (
      SELECT id_aset, count(*)::int AS degree
      FROM pairs
      GROUP BY id_aset
    ),
    pusat_degrees AS (
      SELECT id_pusat_data, count(*)::int AS degree
      FROM pairs
      GROUP BY id_pusat_data
    ),
    one_to_one AS (
      SELECT pairs.*
      FROM pairs
      JOIN aset_degrees USING (id_aset)
      JOIN pusat_degrees USING (id_pusat_data)
      WHERE aset_degrees.degree = 1 AND pusat_degrees.degree = 1
    )
    SELECT
      (SELECT count(*)::int FROM pairs) AS total_pairs,
      (SELECT count(*)::int FROM one_to_one) AS one_to_one_pairs,
      (SELECT count(*)::int FROM aset_degrees) AS matched_aset,
      (SELECT count(*)::int FROM pusat_degrees) AS matched_pusat_data,
      (SELECT count(*)::int FROM aset_degrees WHERE degree > 1) AS ambiguous_aset,
      (
        SELECT count(*)::int
        FROM pusat_degrees
        WHERE degree > 1
      ) AS ambiguous_pusat_data,
      (
        SELECT count(*)::int
        FROM aset
        WHERE id_aset NOT IN (SELECT id_aset FROM aset_degrees)
      ) AS unmatched_aset,
      (
        SELECT count(*)::int
        FROM pusat_data
        WHERE id_pusat_data NOT IN (
          SELECT id_pusat_data FROM pusat_degrees
        )
      ) AS unmatched_pusat_data,
      COALESCE(
        (
          SELECT json_agg(rule_count ORDER BY matched_by)
          FROM (
            SELECT matched_by, count(*)::int AS count
            FROM pairs
            GROUP BY matched_by
          ) AS rule_count
        ),
        '[]'::json
      ) AS by_rule
  `);

  return result.rows[0];
}

async function getIntegrity() {
  const checks = {};

  if ((await tableExists("sewa_aset")) && (await tableExists("aset"))) {
    const result = await client.query(`
      SELECT
        count(*) FILTER (
          WHERE s.id_aset IS NOT NULL AND a.id_aset IS NULL
        )::int AS orphan_aset,
        count(*) FILTER (WHERE s.id_aset IS NULL)::int AS missing_aset
      FROM sewa_aset s
      LEFT JOIN aset a ON a.id_aset = s.id_aset
    `);
    checks.sewa_aset = result.rows[0];
  }

  if ((await tableExists("aset")) && (await tableExists("users"))) {
    const result = await client.query(`
      SELECT count(*) FILTER (WHERE u.id_user IS NULL)::int AS orphan_creator
      FROM aset a
      LEFT JOIN users u ON u.id_user = a.created_by
    `);
    checks.aset = result.rows[0];
  }

  if ((await tableExists("pusat_data")) && (await tableExists("users"))) {
    const result = await client.query(`
      SELECT count(*) FILTER (
        WHERE p.created_by IS NOT NULL AND u.id_user IS NULL
      )::int AS orphan_creator
      FROM pusat_data p
      LEFT JOIN users u ON u.id_user = p.created_by
    `);
    checks.pusat_data = result.rows[0];
  }

  return checks;
}

async function getAggregates(table, columns) {
  const tableColumns = await getColumns(table);
  const available = columns.filter((column) => tableColumns.has(column));
  if (!available.length) return {};

  const expressions = available.map(
    (column) =>
      `COALESCE(sum("${column}"), 0)::text AS "${column}"`,
  );
  const result = await client.query(
    `SELECT ${expressions.join(", ")} FROM "${table}"`,
  );
  return result.rows[0];
}

function renderMarkdown(report) {
  const lines = [
    "# Bhumi Satya Integration Baseline",
    "",
    `Generated: ${report.generated_at}`,
    `Database: ${report.database}`,
    `PostgreSQL: ${report.postgres_version}`,
    "",
    "## Table counts",
    "",
    "| Table | Rows |",
    "| --- | ---: |",
    ...Object.entries(report.table_counts).map(
      ([table, count]) => `| ${table} | ${count} |`,
    ),
    "",
    "## Role distribution",
    "",
    "| Role | Rows |",
    "| --- | ---: |",
    ...report.role_distribution.map(
      (row) => `| ${row.value} | ${row.count} |`,
    ),
    "",
    "## Source distribution",
    "",
  ];

  for (const [table, rows] of Object.entries(report.source_distribution)) {
    lines.push(`### ${table}`, "", "| Source | Rows |", "| --- | ---: |");
    lines.push(...rows.map((row) => `| ${row.value} | ${row.count} |`), "");
  }

  lines.push(
    "## Candidate matches",
    "",
    `- Candidate pairs: ${report.candidate_matches.total_pairs}`,
    `- Safe one-to-one pairs: ${report.candidate_matches.one_to_one_pairs}`,
    `- Matched aset: ${report.candidate_matches.matched_aset}`,
    `- Matched pusat_data: ${report.candidate_matches.matched_pusat_data}`,
    `- Ambiguous aset: ${report.candidate_matches.ambiguous_aset}`,
    `- Ambiguous pusat_data: ${report.candidate_matches.ambiguous_pusat_data}`,
    `- Unmatched aset: ${report.candidate_matches.unmatched_aset}`,
    `- Unmatched pusat_data: ${report.candidate_matches.unmatched_pusat_data}`,
  );
  for (const row of report.candidate_matches.by_rule || []) {
    lines.push(`- ${row.matched_by}: ${row.count}`);
  }

  lines.push("", "## Data quality", "");
  for (const [table, quality] of Object.entries(report.data_quality)) {
    lines.push(`### ${table}`, "", "| Column | Null | Null % | Duplicate values |");
    lines.push("| --- | ---: | ---: | ---: |");
    for (const nullRate of quality.null_rates) {
      lines.push(
        `| ${nullRate.column} | ${nullRate.null_count} | ${nullRate.null_percent}% | ${quality.duplicates[nullRate.column]?.duplicate_values ?? "—"} |`,
      );
    }
    lines.push("");
  }

  lines.push(
    "## Referential integrity",
    "",
    "```json",
    JSON.stringify(report.integrity, null, 2),
    "```",
    "",
    "## Aggregates",
    "",
    "```json",
    JSON.stringify(report.aggregates, null, 2),
    "```",
  );

  return lines.join("\n");
}

try {
  await client.connect();
  await client.query("BEGIN TRANSACTION READ ONLY");

  const metadata = await client.query(`
    SELECT current_database() AS database,
           current_setting('server_version') AS postgres_version
  `);

  const knownTables = [
    "users",
    "aset",
    "aset_sumber",
    "aset_reconciliation",
    "pusat_data",
    "sewa_aset",
    "permintaan_sewa",
    "riwayat",
    "notifikasi",
  ];
  const tableCounts = {};

  for (const table of knownTables) {
    if (await tableExists(table)) {
      tableCounts[table] = await getRowCount(table);
    }
  }

  const dataQuality = {};
  const qualityConfig = {
    aset: ["kode_aset", "nib", "nomor_sertifikat", "lokasi", "polygon_bidang"],
    pusat_data: ["kode_aset", "nib", "nomor_hak", "alamat", "polygon_bidang"],
  };
  const duplicateColumns = {
    aset: ["kode_aset", "nib", "nomor_sertifikat"],
    pusat_data: ["kode_aset", "nib", "nomor_hak"],
  };

  for (const [table, desiredColumns] of Object.entries(qualityConfig)) {
    if (!(await tableExists(table))) continue;
    const availableColumns = await getColumns(table);
    const columns = desiredColumns.filter((column) =>
      availableColumns.has(column),
    );
    const duplicates = {};

    for (const column of duplicateColumns[table].filter((candidate) =>
      availableColumns.has(candidate),
    )) {
      duplicates[column] = await getDuplicates(table, column);
    }

    dataQuality[table] = {
      null_rates: await getNullRates(table, columns, tableCounts[table]),
      duplicates,
    };
  }

  const sourceDistribution = {};
  for (const table of ["aset", "pusat_data"]) {
    if (
      (await tableExists(table)) &&
      (await getColumns(table)).has("sumber")
    ) {
      sourceDistribution[table] = await getDistribution(table, "sumber");
    }
  }

  const report = {
    generated_at: new Date().toISOString(),
    database: metadata.rows[0].database,
    postgres_version: metadata.rows[0].postgres_version,
    table_counts: tableCounts,
    role_distribution: (await tableExists("users"))
      ? await getDistribution("users", "role")
      : [],
    source_distribution: sourceDistribution,
    data_quality: dataQuality,
    candidate_matches: await getCandidateMatches(),
    integrity: await getIntegrity(),
    aggregates: {
      aset: (await tableExists("aset"))
        ? await getAggregates("aset", [
            "luas",
            "luas_lapangan",
            "luas_kib",
            "nilai_aset",
            "harga_perolehan",
            "nilai_buku",
            "nilai_njop",
          ])
        : {},
      pusat_data: (await tableExists("pusat_data"))
        ? await getAggregates("pusat_data", [
            "luas",
            "luas_lapangan",
            "luas_kib",
            "nilai_aset",
            "harga_perolehan",
            "nilai_buku",
            "nilai_njop",
          ])
        : {},
    },
  };

  await client.query("ROLLBACK");
  console.log(jsonOutput ? JSON.stringify(report, null, 2) : renderMarkdown(report));
} catch (error) {
  try {
    await client.query("ROLLBACK");
  } catch {
    // Connection or transaction may not have been established.
  }
  console.error(`Baseline audit failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
