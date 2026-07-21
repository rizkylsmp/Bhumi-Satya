import assert from "node:assert/strict";
import test from "node:test";
import {
  Model3dMetadataValidationError,
  normalizeModel3dMetadata,
} from "./model3dMetadata.js";

test("normalizes editable model 3D metadata", () => {
  assert.deepEqual(normalizeModel3dMetadata({
    display_name: " Gedung Utama ",
    description: "Model hasil survei 2026",
    location_lat: "-7.645",
    location_long: "112.907",
    altitude_m: "",
    scale_x: "1.25",
  }), {
    display_name: "Gedung Utama",
    description: "Model hasil survei 2026",
    location_lat: -7.645,
    location_long: 112.907,
    altitude_m: null,
    scale_x: 1.25,
  });
});

test("rejects invalid model 3D coordinates and scale", () => {
  assert.throws(
    () => normalizeModel3dMetadata({ location_lat: 120 }),
    Model3dMetadataValidationError,
  );
  assert.throws(
    () => normalizeModel3dMetadata({ scale_z: 0 }),
    /Skala Z/,
  );
});
