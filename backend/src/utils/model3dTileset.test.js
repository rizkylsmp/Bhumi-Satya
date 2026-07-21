import assert from "node:assert/strict";
import test from "node:test";
import {
  createEcefModelTransform,
  createModel3dTileset,
} from "./model3dTileset.js";

const makeModel = (id, longitude, latitude) => ({
  id_model_3d: id,
  id_aset: 100 + id,
  version: 1,
  converted_public_url: `https://storage.example/model-${id}.glb`,
  location_long: longitude,
  location_lat: latitude,
  altitude_m: 10,
  heading: 0,
  tilt: 0,
  roll: 0,
  scale_x: 1,
  scale_y: 1,
  scale_z: 1,
});

test("createEcefModelTransform returns a column-major geospatial transform", () => {
  const transform = createEcefModelTransform(makeModel(1, 0, 0));

  assert.equal(transform.length, 16);
  assert.ok(Math.abs(transform[12] - 6378147) < 0.001);
  assert.ok(Math.abs(transform[13]) < 0.001);
  assert.ok(Math.abs(transform[14]) < 0.001);
  assert.equal(transform[15], 1);
});

test("createModel3dTileset builds a 3D Tiles 1.1 hierarchy with GLB contents", () => {
  const models = [
    makeModel(1, 112.89, -7.64),
    makeModel(2, 112.90, -7.65),
    makeModel(3, 112.91, -7.66),
  ];
  const tileset = createModel3dTileset(models, { maxChildren: 2 });

  assert.equal(tileset.asset.version, "1.1");
  assert.equal(tileset.extras.modelCount, 3);
  assert.equal(tileset.root.boundingVolume.region.length, 6);

  const contentUris = [];
  const visit = (tile) => {
    if (tile.content?.uri) contentUris.push(tile.content.uri);
    tile.children?.forEach(visit);
  };
  visit(tileset.root);
  assert.deepEqual(contentUris.sort(), models.map((model) => model.converted_public_url).sort());
});

test("createModel3dTileset ignores incomplete models and handles an empty catalog", () => {
  assert.equal(createModel3dTileset([]), null);
  assert.equal(createModel3dTileset([{ converted_public_url: null }]), null);
});

test("createModel3dTileset creates a low-medium-high replacement chain", () => {
  const model = {
    ...makeModel(4, 112.9, -7.65),
    converted_bounds: { radius: 40, size: [50, 30, 20] },
    converted_triangle_count: 10000,
    lod_medium_public_url: "https://storage.example/model-4-medium.glb",
    lod_medium_triangle_count: 5000,
    lod_low_public_url: "https://storage.example/model-4-low.glb",
    lod_low_triangle_count: 2000,
  };
  const tileset = createModel3dTileset([model]);

  assert.equal(tileset.root.extras.lod, "low");
  assert.equal(tileset.root.refine, "REPLACE");
  assert.equal(tileset.root.children[0].extras.lod, "medium");
  assert.equal(tileset.root.children[0].children[0].extras.lod, "high");
  assert.equal(tileset.root.transform.length, 16);
  assert.equal(tileset.root.children[0].transform, undefined);
});
