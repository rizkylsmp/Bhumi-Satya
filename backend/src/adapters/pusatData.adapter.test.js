import test from "node:test";
import assert from "node:assert/strict";
import {
  adaptLegacyListPayload,
  adaptLegacyStatsPayload,
  normalizeLegacyListQuery,
  toLegacyPusatData,
} from "./pusatData.adapter.js";

test("pusat-data adapter maps master asset fields to the legacy read shape", () => {
  const result = toLegacyPusatData({
    id_aset: 12,
    lokasi: "Jl. Merdeka",
    desa_kelurahan: "Area Operasional",
    penggunaan_saat_ini: "Kantor",
    opd_pengguna: "BPKA",
  });

  assert.equal(result.id_pusat_data, 12);
  assert.equal(result.alamat, "Jl. Merdeka");
  assert.equal(result.kelurahan, "Area Operasional");
  assert.equal(result.penggunaan, "Kantor");
  assert.equal(result.opd, "BPKA");
  assert.equal(result.master_table, "aset");
});

test("pusat-data adapter normalizes pagination and query names", () => {
  const query = normalizeLegacyListQuery({
    sortBy: "kelurahan",
    sortOrder: "ASC",
    opd: "Sekretariat",
  });
  assert.equal(query.sort, "desa_kelurahan");
  assert.equal(query.order, "ASC");
  assert.equal(query.opd_pengguna, "Sekretariat");

  const payload = adaptLegacyListPayload({
    data: [{ id_aset: 1 }],
    pagination: {
      totalItems: 10,
      currentPage: 2,
      itemsPerPage: 5,
      totalPages: 2,
    },
  });
  assert.equal(payload.data[0].id_pusat_data, 1);
  assert.deepEqual(payload.pagination, {
    total: 10,
    page: 2,
    limit: 5,
    totalPages: 2,
  });
});

test("pusat-data stats adapter reads the integrated asset statistics", () => {
  const result = adaptLegacyStatsPayload({
    data: {
      totalAset: 25,
      totalLuas: 500,
      totalSertifikat: 20,
      totalBelumSertifikat: 5,
      bySumber: { BPN: 10, BPKA: 15 },
    },
  });

  assert.equal(result.total, 25);
  assert.equal(result.totalLuas, 500);
  assert.equal(result.sertifikatStats[0].count, 20);
  assert.deepEqual(result.bySumber, { BPN: 10, BPKA: 15 });
  assert.equal(result.successor, "/api/aset/stats");
});
