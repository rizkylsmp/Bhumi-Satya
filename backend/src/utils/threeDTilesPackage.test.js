import assert from "node:assert/strict";
import test from "node:test";
import { strToU8, zipSync } from "fflate";
import {
  inspectThreeDTilesPackage,
  ThreeDTilesPackageValidationError,
} from "./threeDTilesPackage.js";

const makePackage = (contentUri = "tiles/model.glb") => Buffer.from(zipSync({
  "package/tileset.json": strToU8(JSON.stringify({
    asset: { version: "1.1" },
    geometricError: 100,
    root: {
      boundingVolume: { region: [1.9700, -0.1340, 1.9710, -0.1330, 0, 100] },
      geometricError: 0,
      content: { uri: contentUri },
    },
  })),
  "package/tiles/model.glb": strToU8("glTF"),
}));

test("validates a self-contained 3D Tiles ZIP", () => {
  const result = inspectThreeDTilesPackage(makePackage());
  assert.equal(result.manifest.modelEntry, "package/tileset.json");
  assert.equal(result.manifest.entryCount, 2);
  assert.equal(result.manifest.assetVersion, "1.1");
  assert.ok(Math.abs(result.manifest.boundingCenter.longitude - 112.9) < 0.1);
  assert.ok(Math.abs(result.manifest.boundingCenter.latitude - -7.65) < 0.1);
});

test("rejects a missing tile referenced by tileset.json", () => {
  assert.throws(
    () => inspectThreeDTilesPackage(makePackage("tiles/missing.glb")),
    /tidak ditemukan/,
  );
});

test("rejects external content references", () => {
  assert.throws(
    () => inspectThreeDTilesPackage(makePackage("https://example.test/model.glb")),
    ThreeDTilesPackageValidationError,
  );
});

test("rejects archive path traversal", () => {
  assert.throws(
    () => inspectThreeDTilesPackage(Buffer.from(zipSync({
      "../tileset.json": strToU8("{}"),
    }))),
    /tidak aman/,
  );
});

test("rejects a local package without an earth georeference", () => {
  const archive = zipSync({
    "tileset.json": strToU8(JSON.stringify({
      asset: { version: "1.1" },
      geometricError: 20,
      root: {
        boundingVolume: {
          box: [0, 0, 0, 10, 0, 0, 0, 10, 0, 0, 0, 10],
        },
        geometricError: 0,
        content: { uri: "tile.glb" },
      },
    })),
    "tile.glb": strToU8("glTF"),
  });

  assert.throws(
    () => inspectThreeDTilesPackage(Buffer.from(archive)),
    /belum memiliki georeferensi bumi/i,
  );
});

test("normalizes a transformed local box into an ECEF wrapper volume", () => {
  const archive = zipSync({
    "tileset.json": strToU8(JSON.stringify({
      asset: { version: "1.1" },
      geometricError: 20,
      root: {
        boundingVolume: {
          box: [0, 0, 0, 10, 0, 0, 0, 10, 0, 0, 0, 10],
        },
        transform: [
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          6378137, 0, 0, 1,
        ],
        geometricError: 0,
        content: { uri: "tile.glb" },
      },
    })),
    "tile.glb": strToU8("glTF"),
  });

  const result = inspectThreeDTilesPackage(Buffer.from(archive));

  assert.deepEqual(
    result.manifest.rootBoundingVolume.box.slice(0, 3),
    [6378137, 0, 0],
  );
  assert.equal(result.manifest.boundingCenter.longitude, 0);
  assert.ok(Math.abs(result.manifest.boundingCenter.latitude) < 0.0001);
});
