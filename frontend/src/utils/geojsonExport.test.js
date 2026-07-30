import { describe, expect, it } from "vitest";
import { extractGeojsonPolygonPoints } from "./geojsonExport";

const polygon = (coordinates) => ({
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [coordinates],
  },
});

describe("extractGeojsonPolygonPoints", () => {
  it("membaca koordinat GeoJSON WGS84 berurutan longitude-latitude", async () => {
    const result = await extractGeojsonPolygonPoints(
      polygon([
        [112.89, -7.64],
        [112.9, -7.64],
        [112.9, -7.65],
        [112.89, -7.64],
      ]),
    );

    expect(result).toEqual([
      [-7.64, 112.89],
      [-7.64, 112.9],
      [-7.65, 112.9],
    ]);
  });

  it("tetap mendukung polygon lama berurutan latitude-longitude", async () => {
    const result = await extractGeojsonPolygonPoints([
      [-7.64, 112.89],
      [-7.64, 112.9],
      [-7.65, 112.9],
    ]);

    expect(result).toEqual([
      [-7.64, 112.89],
      [-7.64, 112.9],
      [-7.65, 112.9],
    ]);
  });

  it("menolak koordinat proyeksi agar MapLibre tidak mengalami crash", async () => {
    await expect(
      extractGeojsonPolygonPoints(
        polygon([
          [681234, 9156789],
          [681334, 9156789],
          [681334, 9156689],
          [681234, 9156789],
        ]),
      ),
    ).rejects.toThrow("CRS WGS84");
  });

  it("mengonversi UTM EPSG:32749 ke WGS84 secara otomatis", async () => {
    const result = await extractGeojsonPolygonPoints({
      type: "FeatureCollection",
      crs: {
        type: "name",
        properties: { name: "urn:ogc:def:crs:EPSG::32749" },
      },
      features: [
        polygon([
          [427462.4066448657, 9139537.667769926],
          [427487.53279370995, 9139640.050350655],
          [427508.9677299663, 9139726.470055897],
          [427462.4066448657, 9139537.667769926],
        ]),
      ],
    });

    expect(result).toHaveLength(3);
    expect(result[0][0]).toBeCloseTo(-7.782, 2);
    expect(result[0][1]).toBeCloseTo(110.342, 2);
  });

  it("menolak CRS proyeksi yang belum didukung dengan pesan khusus", async () => {
    await expect(
      extractGeojsonPolygonPoints({
        ...polygon([
          [500000, 9000000],
          [500100, 9000000],
          [500100, 8999900],
        ]),
        crs: {
          type: "name",
          properties: { name: "EPSG:23836" },
        },
      }),
    ).rejects.toThrow("belum didukung");
  });
});
