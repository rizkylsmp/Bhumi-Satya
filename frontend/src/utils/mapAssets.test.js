import { describe, expect, it } from "vitest";
import { normalizeMapMarker, parseMapPolygon } from "./mapAssets";

describe("map asset adapter", () => {
  it("normalizes public marker data for the shared map component", () => {
    const marker = normalizeMapMarker({
      id: 7,
      kode: "AST-007",
      nama: "Gedung Pelayanan",
      lat: -7.645,
      lng: 112.907,
      luas: 250,
      polygon: JSON.stringify({
        type: "Polygon",
        coordinates: [[[112.907, -7.645], [112.908, -7.645], [112.907, -7.646]]],
      }),
    });

    expect(marker).toMatchObject({
      id: 7,
      kode_aset: "AST-007",
      nama_aset: "Gedung Pelayanan",
      latitude: -7.645,
      longitude: 112.907,
      luas: "250",
    });
    expect(marker.polygon?.type).toBe("Polygon");
  });

  it("returns null for malformed serialized polygons", () => {
    expect(parseMapPolygon("{invalid-json")).toBeNull();
  });
});
