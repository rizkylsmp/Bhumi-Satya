import test from "node:test";
import assert from "node:assert/strict";
import { getCentroidFromPolygonField } from "./polygonCentroid.js";

test("menghitung centroid polygon array berformat latitude-longitude", () => {
  assert.deepEqual(
    getCentroidFromPolygonField([
      [-7.6, 112.8],
      [-7.8, 113],
    ]),
    { lat: -7.7, lng: 112.9 },
  );
});

test("mendukung titik object dan JSON string", () => {
  assert.deepEqual(
    getCentroidFromPolygonField(
      JSON.stringify([
        { lat: -7.6, lng: 112.8 },
        { latitude: -7.8, longitude: 113 },
      ]),
    ),
    { lat: -7.7, lng: 112.9 },
  );
});

test("mendukung GeoJSON yang menggunakan urutan longitude-latitude", () => {
  assert.deepEqual(
    getCentroidFromPolygonField({
      type: "Polygon",
      coordinates: [
        [
          [112.8, -7.6],
          [113, -7.8],
        ],
      ],
    }),
    { lat: -7.7, lng: 112.9 },
  );
});

test("mengembalikan koordinat kosong untuk polygon tidak valid", () => {
  assert.deepEqual(getCentroidFromPolygonField("bukan-json"), {
    lat: null,
    lng: null,
  });
  assert.deepEqual(getCentroidFromPolygonField([[200, 300]]), {
    lat: null,
    lng: null,
  });
});
