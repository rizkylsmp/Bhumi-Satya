import test from "node:test";
import assert from "node:assert/strict";
import { getChangedFields } from "./auditDiff.js";

test("getChangedFields records only business fields that changed", () => {
  const changed = getChangedFields(
    {
      nama_aset: "Tanah A",
      luas: "100.00",
      polygon_bidang: { coordinates: [[1, 2]], type: "Polygon" },
      updated_at: "2026-07-10T00:00:00.000Z",
    },
    {
      nama_aset: "Tanah A",
      luas: "125.00",
      polygon_bidang: { type: "Polygon", coordinates: [[1, 2]] },
      updated_at: "2026-07-10T01:00:00.000Z",
    },
  );

  assert.deepEqual(changed, ["luas"]);
});

test("getChangedFields includes added and removed fields", () => {
  const changed = getChangedFields(
    { status: "Aktif", notes: "lama" },
    { status: "Bermasalah", jenis_masalah: "Sengketa" },
  );

  assert.deepEqual(changed, ["jenis_masalah", "notes", "status"]);
});
