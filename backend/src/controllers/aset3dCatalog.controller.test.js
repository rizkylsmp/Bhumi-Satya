import assert from "node:assert/strict";
import test from "node:test";
import { csvCell, serializeCatalog } from "./aset3dCatalog.controller.js";

test("serializes catalog management fields from the active model", () => {
  const value = serializeCatalog({
    kode_3d: "3D-000001",
    kode_2d: "2D-000001",
    building_name: "Gedung Rektorat",
    status: "active",
    created_at: "2026-07-01",
    updated_at: "2026-07-02",
    aset: {
      kode_aset: "AST-1",
      nama_aset: "Gedung Utama",
      koordinat_long: 112.8,
      koordinat_lat: -7.6,
      models3d: [{
        id_model_3d: 7,
        kode_3d: "3D-000001",
        is_active: true,
        status: "ready",
        review_status: "active",
        format: "3DTILES",
        manifest: { display_name: "Nama Lama LOD1" },
        converted_public_url: "https://example.test/tileset.json",
        location_long: 112.9,
        location_lat: -7.7,
        updated_at: "2026-07-03",
      }],
    },
  });

  assert.equal(value.category, "Bangunan");
  assert.equal(value.building_name, "Gedung Rektorat");
  assert.equal(value.kode_2d, "2D-000001");
  assert.equal(value.model_status, "active");
  assert.equal(value.center_x, 112.9);
  assert.equal(value.center_y, -7.7);
  assert.equal(value.model_url, "https://example.test/tileset.json");
  assert.equal(value.asset.models3d, undefined);
});

test("does not derive a building name from the asset or an individual LOD", () => {
  const value = serializeCatalog({
    kode_3d: "3D-000002",
    building_name: null,
    status: "active",
    aset: {
      nama_aset: "Nama Bangunan Tidak Digunakan",
      models3d: [{
        id_model_3d: 8,
        kode_3d: "3D-000002",
        is_active: true,
        status: "ready",
        manifest: { display_name: "Nama LOD Tidak Digunakan" },
      }],
    },
  });

  assert.equal(value.building_name, null);
});

test("CSV cells escape commas, quotes, and line breaks", () => {
  assert.equal(csvCell("Gedung A"), "Gedung A");
  assert.equal(csvCell("Gedung, \"A\""), "\"Gedung, \"\"A\"\"\"");
  assert.equal(csvCell(null), "");
});
