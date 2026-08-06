import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeBounds,
  transformBoundsToWgs84,
} from "./orthophoto.service.js";

test("menerima bounds WGS84 yang valid", () => {
  assert.deepEqual(normalizeBounds({
    west: 110.35,
    south: -7.82,
    east: 110.38,
    north: -7.79,
  }), {
    west: 110.35,
    south: -7.82,
    east: 110.38,
    north: -7.79,
  });
});

test("menolak bounds terbalik", () => {
  assert.equal(normalizeBounds({ west: 111, south: -7, east: 110, north: -8 }), null);
});

test("mengubah UTM zona 49 selatan menjadi WGS84", () => {
  const bounds = transformBoundsToWgs84(
    [427000, 9135000, 428000, 9136000],
    32749,
  );
  assert.ok(bounds);
  assert.ok(bounds.west > 109 && bounds.west < 112);
  assert.ok(bounds.south > -9 && bounds.south < -6);
});
