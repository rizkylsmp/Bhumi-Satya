import { describe, expect, it } from "vitest";
import { getModelFocusZoom, resolveModelOffsetLocation } from "./model3dTransform";

describe("model 3D position offsets", () => {
  it("converts local X, Y, Z meter offsets to a map anchor", () => {
    const result = resolveModelOffsetLocation({
      location_long: 110.343751,
      location_lat: -7.783186,
      altitude_m: 5,
      offset_x_m: 10,
      offset_y_m: -20,
      offset_z_m: 3,
    });

    expect(result.longitude).toBeGreaterThan(110.343751);
    expect(result.latitude).toBeLessThan(-7.783186);
    expect(result.altitude).toBe(8);
  });

  it("does not interpret missing coordinates as the location 0,0", () => {
    const result = resolveModelOffsetLocation({
      location_long: null,
      location_lat: "",
      offset_x_m: 25,
      offset_y_m: 25,
    });

    expect(Number.isNaN(result.longitude)).toBe(true);
    expect(Number.isNaN(result.latitude)).toBe(true);
  });

  it("zooms out enough to show a large imported KMZ model", () => {
    expect(getModelFocusZoom({
      converted_bounds: { radius: 230 },
    })).toBe(15.5);
    expect(getModelFocusZoom({
      manifest: { bounds: { radius: 90 } },
    })).toBe(16.5);
    expect(getModelFocusZoom({})).toBe(18);
  });
});
