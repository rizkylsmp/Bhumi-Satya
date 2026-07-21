import test from "node:test";
import assert from "node:assert/strict";
import { normalizeAsset3dFields } from "./asset3d.js";

test("normalizes valid LOD1 metadata", () => {
  const result = normalizeAsset3dFields({
    building_footprint: [[-7.64, 112.9], [-7.64, 112.91], [-7.65, 112.91]],
    building_height_m: "8.5",
    building_floors: "2",
    building_height_source: "survey",
    building_height_quality: "measured",
    model_3d_lod: "lod1",
    model_3d_source_crs: "epsg:32749",
  });
  assert.equal(result.building_height_m, 8.5);
  assert.equal(result.building_floors, 2);
  assert.equal(result.model_3d_lod, "LOD1");
  assert.equal(result.model_3d_source_crs, "EPSG:32749");
});

test("rejects invalid height, floors, and CRS", () => {
  assert.throws(() => normalizeAsset3dFields({ building_height_m: -2 }), /Tinggi/);
  assert.throws(() => normalizeAsset3dFields({ building_floors: 1.5 }), /bilangan bulat/);
  assert.throws(() => normalizeAsset3dFields({ model_3d_source_crs: "UTM 49S" }), /EPSG/);
});

test("partial normalization excludes unrelated fields", () => {
  assert.deepEqual(
    normalizeAsset3dFields({ nama_aset: "A", building_height_m: "12" }, { partial: true }),
    { building_height_m: 12 },
  );
});

