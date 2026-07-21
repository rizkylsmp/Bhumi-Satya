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

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const jsonOutput = args.has("--json");
const createUnmatched = !args.has("--skip-create-unmatched");
const batchName =
  process.argv.find((arg) => arg.startsWith("--batch="))?.split("=")[1] ||
  "epic2-reconciliation-2026-07-09";

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

const normalize = (value) => {
  if (value === null || value === undefined) return null;
  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  return normalized || null;
};

const isBlank = (value) =>
  value === null || value === undefined || String(value).trim() === "";

const normalizeComparable = (value) => {
  if (isBlank(value)) return null;
  return String(value).trim().toLowerCase().replace(/\s+/g, " ");
};

const normalizeNumber = (value) => {
  if (isBlank(value)) return null;
  const numeric = Number(String(value).replace(",", "."));
  if (!Number.isFinite(numeric)) return normalizeComparable(value);
  return String(Number(numeric.toFixed(2)));
};

const comparableValue = (field, value) => {
  if (
    [
      "luas",
      "luas_lapangan",
      "nilai_aset",
      "nilai_buku",
      "nilai_njop",
      "luas_kib",
      "harga_perolehan",
      "koordinat_lat",
      "koordinat_long",
    ].includes(field)
  ) {
    return normalizeNumber(value);
  }

  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }

  return normalizeComparable(value);
};

const mapping = [
  { target: "kode_aset", source: "kode_aset", conflict: true },
  { target: "nama_aset", source: "nama_aset", conflict: true },
  { target: "status", source: "status", conflict: true },
  { target: "jenis_masalah", source: "jenis_masalah", conflict: true },
  { target: "jenis_aset", source: "jenis_aset", conflict: true },
  { target: "nib", source: "nib", conflict: true },
  { target: "nomor_sertifikat", source: "nomor_hak", conflict: true },
  { target: "nomor_hak", source: "nomor_hak", conflict: false },
  { target: "jenis_hak", source: "jenis_hak", conflict: true },
  { target: "luas", source: "luas", conflict: true },
  { target: "luas_lapangan", source: "luas_lapangan", conflict: true },
  { target: "batas_utara", source: "batas_utara", conflict: true },
  { target: "batas_selatan", source: "batas_selatan", conflict: true },
  { target: "batas_timur", source: "batas_timur", conflict: true },
  { target: "batas_barat", source: "batas_barat", conflict: true },
  {
    target: "penggunaan_saat_ini",
    source: (row) => row.penggunaan_saat_ini || row.penggunaan,
    sourceName: "penggunaan_saat_ini/penggunaan",
    conflict: true,
  },
  { target: "kecamatan", source: "kecamatan", conflict: true },
  { target: "desa_kelurahan", source: "kelurahan", conflict: true },
  { target: "lokasi", source: "alamat", conflict: true },
  { target: "status_sertifikat", source: "status_sertifikat", conflict: true },
  { target: "surat_ukur", source: "surat_ukur", conflict: true },
  { target: "pemilik_pertama", source: "pemilik_pertama", conflict: true },
  { target: "pemilik_akhir", source: "pemilik_akhir", conflict: true },
  { target: "atas_nama", source: "atas_nama", conflict: true },
  { target: "tanggal_sertifikat", source: "tanggal_sertifikat", conflict: true },
  { target: "riwayat_perolehan", source: "riwayat_perolehan", conflict: true },
  { target: "status_hukum", source: "status_hukum", conflict: true },
  { target: "produk", source: "produk", conflict: true },
  { target: "kw", source: "kw", conflict: true },
  {
    target: "opd_pengguna",
    source: (row) => row.opd_pengguna || row.opd,
    sourceName: "opd_pengguna/opd",
    conflict: true,
  },
  { target: "nilai_aset", source: "nilai_aset", conflict: true },
  { target: "tahun_perolehan", source: "tahun_perolehan", conflict: true },
  { target: "kode_bmd", source: "kode_bmd", conflict: true },
  { target: "nilai_buku", source: "nilai_buku", conflict: true },
  { target: "nilai_njop", source: "nilai_njop", conflict: true },
  { target: "sk_penetapan", source: "sk_penetapan", conflict: true },
  { target: "nibar", source: "nibar", conflict: true },
  { target: "id_pemda", source: "id_pemda", conflict: true },
  { target: "kode_barang", source: "kode_barang", conflict: true },
  { target: "no_register", source: "no_register", conflict: true },
  { target: "luas_kib", source: "luas_kib", conflict: true },
  { target: "harga_perolehan", source: "harga_perolehan", conflict: true },
  { target: "penggunaan_kib", source: "penggunaan_kib", conflict: true },
  { target: "tanggal_scan", source: "tanggal_scan", conflict: true },
  { target: "file_sertifikat", source: "file_sertifikat", conflict: true },
  { target: "notes", source: "notes", conflict: false },
  { target: "plotting_status", source: "plotting_status", conflict: true },
  { target: "koordinat_lat", source: "koordinat_lat", conflict: true },
  { target: "koordinat_long", source: "koordinat_long", conflict: true },
  { target: "polygon_bidang", source: "polygon_bidang", conflict: true },
  { target: "foto_aset", source: "foto_aset", conflict: true },
  { target: "dokumen_pendukung", source: "dokumen_pendukung", conflict: true },
  { target: "keterangan", source: "keterangan", conflict: false },
];

const getSourceValue = (sourceRow, item) =>
  typeof item.source === "function" ? item.source(sourceRow) : sourceRow[item.source];

const snapshotFields = [
  "kode_aset",
  "nama_aset",
  "nib",
  "nomor_sertifikat",
  "nomor_hak",
  "jenis_hak",
  "luas",
  "luas_lapangan",
  "kecamatan",
  "desa_kelurahan",
  "lokasi",
  "status_sertifikat",
  "surat_ukur",
  "produk",
  "opd_pengguna",
  "koordinat_lat",
  "koordinat_long",
  "polygon_bidang",
];

const buildTargetSnapshot = (row) =>
  Object.fromEntries(snapshotFields.map((field) => [field, row[field] ?? null]));

const buildSourceSnapshot = (row) => {
  const snapshot = {};
  for (const item of mapping) {
    snapshot[item.target] = getSourceValue(row, item) ?? null;
  }
  snapshot.id_pusat_data = row.id_pusat_data;
  snapshot.sumber = row.sumber;
  return snapshot;
};

const getFillAndConflict = (targetRow, sourceRow) => {
  const fillValues = {};
  const conflictFields = [];

  for (const item of mapping) {
    const sourceValue = getSourceValue(sourceRow, item);
    const targetValue = targetRow[item.target];

    if (isBlank(sourceValue)) continue;

    if (isBlank(targetValue)) {
      fillValues[item.target] = sourceValue;
      continue;
    }

    if (
      item.conflict &&
      comparableValue(item.target, targetValue) !== comparableValue(item.target, sourceValue)
    ) {
      conflictFields.push({
        target: item.target,
        source: item.sourceName || item.source,
        existing: targetValue,
        proposed: sourceValue,
      });
    }
  }

  return { fillValues, conflictFields };
};

const groupCount = (rows, key) => {
  const counts = new Map();
  for (const row of rows) {
    const value = row[key];
    if (!value) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return counts;
};

const pickIdentifier = (row) =>
  row.nib || row.kode_aset || row.nomor_hak || row.nomor_sertifikat || null;

const buildCandidates = (asetRows, pusatRows) => {
  const asetByIdentifier = {
    nib: new Map(),
    kode: new Map(),
    sertifikat: new Map(),
  };

  const addAset = (key, value, row) => {
    if (!value) return;
    if (!asetByIdentifier[key].has(value)) asetByIdentifier[key].set(value, []);
    asetByIdentifier[key].get(value).push(row);
  };

  for (const row of asetRows) {
    addAset("nib", row.norm_nib, row);
    addAset("kode", row.norm_kode_aset, row);
    addAset("sertifikat", row.norm_nomor_sertifikat, row);
  }

  const pairs = new Map();

  const addPair = (asetRow, pusatRow, rule) => {
    const key = `${asetRow.id_aset}:${pusatRow.id_pusat_data}`;
    const existing = pairs.get(key);
    const priority = { nib: 1, kode_aset: 2, nomor_sertifikat: 3 };

    if (!existing || priority[rule] < priority[existing.match_rule]) {
      pairs.set(key, {
        id_aset: asetRow.id_aset,
        id_pusat_data: pusatRow.id_pusat_data,
        match_rule: rule,
        aset: asetRow,
        pusat: pusatRow,
      });
    }
  };

  for (const pusatRow of pusatRows) {
    for (const asetRow of asetByIdentifier.nib.get(pusatRow.norm_nib) || []) {
      addPair(asetRow, pusatRow, "nib");
    }
    for (const asetRow of asetByIdentifier.kode.get(pusatRow.norm_kode_aset) || []) {
      addPair(asetRow, pusatRow, "kode_aset");
    }
    for (const asetRow of asetByIdentifier.sertifikat.get(pusatRow.norm_nomor_hak) || []) {
      addPair(asetRow, pusatRow, "nomor_sertifikat");
    }
  }

  const pairRows = [...pairs.values()];
  const asetDegrees = groupCount(pairRows, "id_aset");
  const pusatDegrees = groupCount(pairRows, "id_pusat_data");

  const enriched = pairRows.map((pair) => {
    const { fillValues, conflictFields } = getFillAndConflict(pair.aset, pair.pusat);
    const safeOneToOne =
      asetDegrees.get(pair.id_aset) === 1 && pusatDegrees.get(pair.id_pusat_data) === 1;

    return {
      ...pair,
      safe_one_to_one: safeOneToOne,
      fill_values: fillValues,
      conflict_fields: safeOneToOne
        ? conflictFields
        : [
            {
              target: "matching",
              source: pair.match_rule,
              existing: `aset:${pair.id_aset}`,
              proposed: `pusat_data:${pair.id_pusat_data}`,
            },
            ...conflictFields,
          ],
    };
  });

  const matchedPusat = new Set(enriched.map((pair) => pair.id_pusat_data));
  const matchedAset = new Set(enriched.map((pair) => pair.id_aset));

  return {
    pairs: enriched,
    safePairs: enriched.filter((pair) => pair.safe_one_to_one),
    ambiguousPairs: enriched.filter((pair) => !pair.safe_one_to_one),
    unmatchedPusat: pusatRows.filter((row) => !matchedPusat.has(row.id_pusat_data)),
    unmatchedAset: asetRows.filter((row) => !matchedAset.has(row.id_aset)),
    asetDegrees,
    pusatDegrees,
  };
};

const getRows = async () => {
  const aset = (
    await client.query(`
      SELECT *,
             NULLIF(regexp_replace(lower(trim(nib::text)), '[^a-z0-9]+', '', 'g'), '') AS norm_nib,
             NULLIF(regexp_replace(lower(trim(kode_aset::text)), '[^a-z0-9]+', '', 'g'), '') AS norm_kode_aset,
             NULLIF(regexp_replace(lower(trim(nomor_sertifikat::text)), '[^a-z0-9]+', '', 'g'), '') AS norm_nomor_sertifikat
      FROM aset
    `)
  ).rows;

  const pusat = (
    await client.query(`
      SELECT *,
             NULLIF(regexp_replace(lower(trim(nib::text)), '[^a-z0-9]+', '', 'g'), '') AS norm_nib,
             NULLIF(regexp_replace(lower(trim(kode_aset::text)), '[^a-z0-9]+', '', 'g'), '') AS norm_kode_aset,
             NULLIF(regexp_replace(lower(trim(nomor_hak::text)), '[^a-z0-9]+', '', 'g'), '') AS norm_nomor_hak
      FROM pusat_data
    `)
  ).rows;

  return { aset, pusat };
};

const insertAsetSource = async ({
  idAset,
  instansi,
  sourceTable,
  sourceId,
  sourceIdentifier,
  referenceValues,
  importedBy,
  importedAt,
}) => {
  const result = await client.query(
    `
      INSERT INTO aset_sumber (
        id_aset,
        instansi,
        source_table,
        source_id,
        source_identifier,
        import_batch,
        reference_values,
        imported_at,
        imported_by,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, COALESCE($8, NOW()), $9, NOW(), NOW())
      ON CONFLICT ("source_table", "source_id")
      WHERE "source_id" IS NOT NULL
      DO NOTHING
      RETURNING id_aset_sumber
    `,
    [
      idAset,
      instansi || "LAINNYA",
      sourceTable,
      sourceId,
      sourceIdentifier,
      batchName,
      JSON.stringify(referenceValues || {}),
      importedAt,
      importedBy,
    ],
  );

  return result.rowCount;
};

const insertReconciliation = async (pair, status) => {
  const existing = await client.query(
    `
      SELECT 1
      FROM aset_reconciliation
      WHERE id_aset = $1
        AND id_pusat_data = $2
        AND COALESCE(match_rule, '') = COALESCE($3, '')
      LIMIT 1
    `,
    [pair.id_aset, pair.id_pusat_data, pair.match_rule],
  );

  if (existing.rowCount > 0) return 0;

  const result = await client.query(
    `
      INSERT INTO aset_reconciliation (
        id_aset,
        id_pusat_data,
        status,
        match_rule,
        match_confidence,
        existing_values,
        proposed_values,
        conflict_fields,
        notes,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9, NOW(), NOW())
    `,
    [
      pair.id_aset,
      pair.id_pusat_data,
      status,
      pair.match_rule,
      pair.safe_one_to_one ? 100 : 50,
      JSON.stringify(buildTargetSnapshot(pair.aset)),
      JSON.stringify(buildSourceSnapshot(pair.pusat)),
      JSON.stringify(pair.conflict_fields),
      pair.safe_one_to_one
        ? "Kandidat one-to-one dari Epic 2."
        : "Kandidat ambigu dari Epic 2; perlu review manual.",
    ],
  );

  return result.rowCount;
};

const updateAsetNullFields = async (idAset, fillValues, status) => {
  const entries = Object.entries(fillValues).filter(([, value]) => !isBlank(value));
  if (entries.length === 0) {
    await client.query(
      `
        UPDATE aset
        SET reconciliation_status = $2,
            reconciliation_notes = COALESCE(reconciliation_notes, 'Diproses oleh Epic 2.'),
            updated_at = NOW()
        WHERE id_aset = $1
          AND reconciliation_status = 'belum_diperiksa'
      `,
      [idAset, status],
    );
    return { updated: 0, statusUpdated: 1 };
  }

  const assignments = entries.map(
    ([column], index) =>
      `"${column}" = CASE WHEN "${column}" IS NULL OR trim("${column}"::text) = '' THEN $${index + 3} ELSE "${column}" END`,
  );

  await client.query(
    `
      UPDATE aset
      SET ${assignments.join(", ")},
          reconciliation_status = $2,
          reconciliation_notes = COALESCE(reconciliation_notes, 'Diproses oleh Epic 2.'),
          updated_at = NOW()
      WHERE id_aset = $1
    `,
    [idAset, status, ...entries.map(([, value]) => value)],
  );

  return { updated: entries.length, statusUpdated: 1 };
};

const setAmbiguousStatuses = async (pairs) => {
  const ids = [...new Set(pairs.map((pair) => pair.id_aset))];
  if (ids.length === 0) return 0;

  const result = await client.query(
    `
      UPDATE aset
      SET reconciliation_status = 'konflik',
          reconciliation_notes = COALESCE(
            reconciliation_notes,
            'Memiliki kandidat pusat_data ambigu dari Epic 2.'
          ),
          updated_at = NOW()
      WHERE id_aset = ANY($1::int[])
        AND reconciliation_status <> 'terverifikasi'
    `,
    [ids],
  );

  return result.rowCount;
};

const createAsetFromPusatData = async (row) => {
  if (!createUnmatched) return { created: false, reason: "disabled" };

  const requiredMissing = [];
  if (isBlank(row.kode_aset)) requiredMissing.push("kode_aset");
  if (isBlank(row.nama_aset)) requiredMissing.push("nama_aset");
  if (isBlank(row.alamat)) requiredMissing.push("alamat");
  if (isBlank(row.created_by)) requiredMissing.push("created_by");

  if (requiredMissing.length > 0) {
    return {
      created: false,
      reason: `missing required fields: ${requiredMissing.join(", ")}`,
    };
  }

  const result = await client.query(
    `
      INSERT INTO aset (
        kode_aset,
        nama_aset,
        lokasi,
        koordinat_lat,
        koordinat_long,
        luas,
        status,
        jenis_masalah,
        jenis_aset,
        sumber,
        nilai_aset,
        tahun_perolehan,
        nomor_sertifikat,
        nomor_hak,
        status_sertifikat,
        foto_aset,
        dokumen_pendukung,
        keterangan,
        jenis_hak,
        atas_nama,
        tanggal_sertifikat,
        surat_ukur,
        produk,
        pemilik_pertama,
        pemilik_akhir,
        riwayat_perolehan,
        status_hukum,
        kecamatan,
        desa_kelurahan,
        luas_lapangan,
        batas_utara,
        batas_selatan,
        batas_timur,
        batas_barat,
        penggunaan_saat_ini,
        nib,
        kw,
        nibar,
        id_pemda,
        kode_barang,
        no_register,
        luas_kib,
        harga_perolehan,
        penggunaan_kib,
        tanggal_scan,
        file_sertifikat,
        notes,
        plotting_status,
        kode_bmd,
        nilai_buku,
        nilai_njop,
        sk_penetapan,
        opd_pengguna,
        polygon_bidang,
        reconciliation_status,
        reconciliation_notes,
        created_by,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, COALESCE($7, 'Aktif'), $8, $9, 'BPN',
        $10, $11, $12, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32,
        COALESCE($33, $34), $35, $36, $37, $38, $39, $40, $41, $42,
        $43, $44, $45, $46, $47, $48, $49, $50, $51, COALESCE($52, $53),
        $54, 'cocok', 'Dibuat dari pusat_data oleh Epic 2 karena tidak memiliki kandidat aset.',
        $55, COALESCE($56, NOW()), COALESCE($57, NOW())
      )
      RETURNING id_aset
    `,
    [
      row.kode_aset,
      row.nama_aset,
      row.alamat,
      row.koordinat_lat,
      row.koordinat_long,
      row.luas,
      row.status,
      row.jenis_masalah,
      row.jenis_aset,
      row.nilai_aset,
      row.tahun_perolehan,
      row.nomor_hak,
      row.status_sertifikat,
      row.foto_aset,
      row.dokumen_pendukung,
      row.keterangan,
      row.jenis_hak,
      row.atas_nama,
      row.tanggal_sertifikat,
      row.surat_ukur,
      row.produk,
      row.pemilik_pertama,
      row.pemilik_akhir,
      row.riwayat_perolehan,
      row.status_hukum,
      row.kecamatan,
      row.kelurahan,
      row.luas_lapangan,
      row.batas_utara,
      row.batas_selatan,
      row.batas_timur,
      row.batas_barat,
      row.penggunaan_saat_ini,
      row.penggunaan,
      row.nib,
      row.kw,
      row.nibar,
      row.id_pemda,
      row.kode_barang,
      row.no_register,
      row.luas_kib,
      row.harga_perolehan,
      row.penggunaan_kib,
      row.tanggal_scan,
      row.file_sertifikat,
      row.notes,
      row.plotting_status,
      row.kode_bmd,
      row.nilai_buku,
      row.nilai_njop,
      row.sk_penetapan,
      row.opd_pengguna,
      row.opd,
      row.polygon_bidang,
      row.created_by,
      row.created_at,
      row.updated_at,
    ],
  );

  return { created: true, id_aset: result.rows[0].id_aset };
};

const aggregate = async () => {
  const counts = (
    await client.query(`
      SELECT
        (SELECT COUNT(*)::int FROM aset) AS aset,
        (SELECT COUNT(*)::int FROM pusat_data) AS pusat_data,
        (SELECT COUNT(*)::int FROM aset_sumber) AS aset_sumber,
        (SELECT COUNT(*)::int FROM aset_reconciliation) AS aset_reconciliation,
        (SELECT COUNT(*)::int FROM sewa_aset s LEFT JOIN aset a ON a.id_aset = s.id_aset WHERE s.id_aset IS NOT NULL AND a.id_aset IS NULL) AS orphan_sewa_aset
    `)
  ).rows[0];

  const statuses = (
    await client.query(`
      SELECT reconciliation_status, COUNT(*)::int AS count
      FROM aset
      GROUP BY reconciliation_status
      ORDER BY reconciliation_status
    `)
  ).rows;

  return { counts, statuses };
};

const summarize = (candidates) => {
  const safeWithConflicts = candidates.safePairs.filter(
    (pair) => pair.conflict_fields.length > 0,
  );
  const safeWithoutConflicts = candidates.safePairs.filter(
    (pair) => pair.conflict_fields.length === 0,
  );
  const fillableSafePairs = candidates.safePairs.filter(
    (pair) => Object.keys(pair.fill_values).length > 0,
  );

  const byRule = {};
  const conflictByField = {};
  const fillByFieldSafe = {};

  for (const pair of candidates.pairs) {
    byRule[pair.match_rule] = (byRule[pair.match_rule] || 0) + 1;
    for (const field of pair.conflict_fields) {
      conflictByField[field.target] = (conflictByField[field.target] || 0) + 1;
    }
    if (pair.safe_one_to_one) {
      for (const field of Object.keys(pair.fill_values)) {
        fillByFieldSafe[field] = (fillByFieldSafe[field] || 0) + 1;
      }
    }
  }

  return {
    total_pairs: candidates.pairs.length,
    safe_one_to_one_pairs: candidates.safePairs.length,
    safe_without_conflicts: safeWithoutConflicts.length,
    safe_with_conflicts: safeWithConflicts.length,
    ambiguous_pairs: candidates.ambiguousPairs.length,
    ambiguous_aset: [...candidates.asetDegrees.values()].filter((degree) => degree > 1)
      .length,
    ambiguous_pusat_data: [...candidates.pusatDegrees.values()].filter(
      (degree) => degree > 1,
    ).length,
    unmatched_pusat_data: candidates.unmatchedPusat.length,
    unmatched_aset: candidates.unmatchedAset.length,
    fillable_safe_pairs: fillableSafePairs.length,
    by_rule: byRule,
    conflict_by_field: conflictByField,
    fill_by_field_safe: fillByFieldSafe,
  };
};

const renderMarkdown = (report) => {
  const lines = [
    `# Epic 2 ${report.mode === "apply" ? "Apply" : "Dry-run"} Report`,
    "",
    `Generated: ${report.generated_at}`,
    `Batch: ${report.batch}`,
    "",
    "## Summary",
    "",
    "| Metric | Value |",
    "| --- | ---: |",
  ];

  for (const [key, value] of Object.entries(report.summary)) {
    if (typeof value !== "object") lines.push(`| ${key} | ${value} |`);
  }

  lines.push("", "## Match by rule", "", "| Rule | Pairs |", "| --- | ---: |");
  for (const [rule, count] of Object.entries(report.summary.by_rule)) {
    lines.push(`| ${rule} | ${count} |`);
  }

  lines.push("", "## Apply result", "", "```json");
  lines.push(JSON.stringify(report.apply_result, null, 2));
  lines.push("```", "", "## Post state", "", "```json");
  lines.push(JSON.stringify(report.post_state, null, 2));
  lines.push("```");

  return lines.join("\n");
};

try {
  await client.connect();
  await client.query("SET statement_timeout = '60s'");
  const before = await aggregate();
  const rows = await getRows();
  const candidates = buildCandidates(rows.aset, rows.pusat);
  const summary = summarize(candidates);

  const applyResult = {
    aset_sources_inserted: 0,
    reconciliations_inserted: 0,
    aset_field_values_filled: 0,
    aset_status_updates_attempted: 0,
    ambiguous_aset_status_updates: 0,
    unmatched_assets_created: 0,
    unmatched_assets_skipped: [],
  };

  if (apply) {
    await client.query("BEGIN");

    try {
      for (const aset of rows.aset) {
        applyResult.aset_sources_inserted += await insertAsetSource({
          idAset: aset.id_aset,
          instansi: aset.sumber || "LAINNYA",
          sourceTable: "aset",
          sourceId: aset.id_aset,
          sourceIdentifier: pickIdentifier(aset),
          referenceValues: buildTargetSnapshot(aset),
          importedBy: aset.created_by,
          importedAt: aset.created_at,
        });
      }

      for (const pair of candidates.pairs) {
        const status =
          pair.safe_one_to_one && pair.conflict_fields.length === 0 ? "cocok" : "konflik";

        if (pair.safe_one_to_one) {
          applyResult.aset_sources_inserted += await insertAsetSource({
            idAset: pair.id_aset,
            instansi: pair.pusat.sumber || "BPN",
            sourceTable: "pusat_data",
            sourceId: pair.id_pusat_data,
            sourceIdentifier: pickIdentifier(pair.pusat),
            referenceValues: buildSourceSnapshot(pair.pusat),
            importedBy: pair.pusat.created_by,
            importedAt: pair.pusat.created_at,
          });
        }

        applyResult.reconciliations_inserted += await insertReconciliation(pair, status);

        if (pair.safe_one_to_one) {
          const updateResult = await updateAsetNullFields(
            pair.id_aset,
            pair.fill_values,
            status,
          );
          applyResult.aset_field_values_filled += updateResult.updated;
          applyResult.aset_status_updates_attempted += updateResult.statusUpdated;
        }
      }

      applyResult.ambiguous_aset_status_updates = await setAmbiguousStatuses(
        candidates.ambiguousPairs,
      );

      for (const row of candidates.unmatchedPusat) {
        const created = await createAsetFromPusatData(row);
        if (created.created) {
          applyResult.unmatched_assets_created += 1;
          applyResult.aset_sources_inserted += await insertAsetSource({
            idAset: created.id_aset,
            instansi: row.sumber || "BPN",
            sourceTable: "pusat_data",
            sourceId: row.id_pusat_data,
            sourceIdentifier: pickIdentifier(row),
            referenceValues: buildSourceSnapshot(row),
            importedBy: row.created_by,
            importedAt: row.created_at,
          });
        } else {
          applyResult.unmatched_assets_skipped.push({
            id_pusat_data: row.id_pusat_data,
            reason: created.reason,
          });
        }
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }

  const postState = await aggregate();
  const report = {
    mode: apply ? "apply" : "dry-run",
    generated_at: new Date().toISOString(),
    batch: batchName,
    before,
    summary,
    apply_result: applyResult,
    post_state: postState,
  };

  console.log(jsonOutput ? JSON.stringify(report, null, 2) : renderMarkdown(report));
} catch (error) {
  console.error(`Epic 2 reconciliation failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
