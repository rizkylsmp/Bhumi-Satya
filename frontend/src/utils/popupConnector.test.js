import { describe, expect, it } from "vitest";
import {
  buildPopupConnectorGeometry,
  getGeometryBoundsCenter,
} from "./popupConnector";

describe("popup connector geometry", () => {
  it("menghubungkan sisi popup ke titik bangunan", () => {
    const result = buildPopupConnectorGeometry(
      { left: 100, top: 40, right: 420, bottom: 180 },
      { left: 0, top: 0, width: 800, height: 500 },
      { x: 520, y: 380 },
    );
    expect(result.path).toMatch(/^M /);
    expect(result.path).toContain("520.0 380.0");
    expect(result.width).toBe(800);
  });

  it("menolak anchor yang tidak valid", () => {
    expect(buildPopupConnectorGeometry(
      { left: 0, top: 0, right: 10, bottom: 10 },
      { left: 0, top: 0, width: 100, height: 100 },
      { x: Number.NaN, y: 20 },
    )).toBeNull();
  });

  it("menggunakan pusat batas geometri sebagai anchor", () => {
    expect(getGeometryBoundsCenter({
      type: "Polygon",
      coordinates: [[
        [110.1, -7.8],
        [110.2, -7.8],
        [110.2, -7.7],
        [110.1, -7.7],
        [110.1, -7.8],
      ]],
    })).toEqual([110.15, -7.75]);
  });
});
