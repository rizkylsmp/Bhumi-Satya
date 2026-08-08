import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCodeBase,
  hasCoordinates,
  hasPolygon,
  serializeCatalog,
  summarizeDigitalTwinCoverage,
} from "./aset2dCatalog.controller.js";

describe("aset2d catalog helpers", () => {
  it("membuat kode 2D dari kode bangunan", () => {
    assert.equal(
      buildCodeBase({ kode_aset: "AST/STPN 001", id_aset: 7 }),
      "2D-AST-STPN-001",
    );
  });

  it("membedakan kelengkapan koordinat dan polygon", () => {
    assert.equal(hasCoordinates({ koordinat_lat: "-7.78", koordinat_long: "110.34" }), true);
    assert.equal(hasCoordinates({ koordinat_lat: null, koordinat_long: "110.34" }), false);
    assert.equal(hasPolygon({ polygon_bidang: [[110.34, -7.78]] }), true);
    assert.equal(hasPolygon({ polygon_bidang: "[]" }), false);
  });

  it("menyajikan relasi aset dan jumlah bangunan", () => {
    const result = serializeCatalog({
      kode_2d: "2D-AST-001",
      id_aset: 7,
      status: "active",
      is_managed: true,
      building_count: "2",
      aset: {
        kode_aset: "AST-001",
        koordinat_lat: -7.78,
        koordinat_long: 110.34,
        polygon_bidang: { type: "Polygon", coordinates: [] },
      },
    });

    assert.equal(result.building_count, 2);
    assert.equal(result.has_coordinates, true);
    assert.equal(result.has_polygon, true);
    assert.equal(result.asset.kode_aset, "AST-001");
  });

  it("meringkas cakupan bangunan 3D berdasarkan bidang unik", () => {
    assert.deepEqual(summarizeDigitalTwinCoverage(10, 6), {
      totalWithBuildings: 6,
      totalWithoutBuildings: 4,
    });
    assert.deepEqual(summarizeDigitalTwinCoverage(3, 7), {
      totalWithBuildings: 3,
      totalWithoutBuildings: 0,
    });
  });
});
