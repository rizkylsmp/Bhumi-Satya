import assert from "node:assert/strict";
import test from "node:test";
import { normalizeModel3dObject, parseCsv } from "./model3dObject.js";

test("normalizes model 3D object attributes", () => {
  const value = normalizeModel3dObject({
    object_code: "BLD-01",
    nama: "Gedung Utama",
    kategori: "bangunan",
    luas_m2: "125,5",
    properties_json: "{\"warna\":\"putih\"}",
  });
  assert.equal(value.object_code, "BLD-01");
  assert.equal(value.area_m2, 125.5);
  assert.deepEqual(value.properties, { warna: "putih" });
});

test("rejects invalid object attributes", () => {
  assert.throws(() => normalizeModel3dObject({ object_code: "", name: "A" }), /Kode objek/);
  assert.throws(() => normalizeModel3dObject({ object_code: "A", name: "A", category: "jalan" }), /Kategori/);
  assert.throws(() => normalizeModel3dObject({ object_code: "A", name: "A", area_m2: -2 }), /Luas/);
});

test("parses quoted CSV values", () => {
  const [row] = parseCsv("object_code,name,properties_json\nA-1,\"Gedung, Utama\",\"{\"\"warna\"\":\"\"biru\"\"}\"\n");
  assert.equal(row.name, "Gedung, Utama");
  assert.equal(row.properties_json, "{\"warna\":\"biru\"}");
});
