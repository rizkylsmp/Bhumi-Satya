import { describe, expect, it } from "vitest";
import { getAsset3dSummary } from "./asset3dGeojson";

describe("asset3dGeojson", () => {
  it("marks floor-derived height as estimate", () => {
    const summary = getAsset3dSummary({ building_floors: 2 });
    expect(summary.height).toBe(7);
    expect(summary.quality).toBe("estimated");
  });

  it("treats an active detailed model as usable 3D data", () => {
    const summary = getAsset3dSummary({
      active_model_3d: { public_url: "https://storage.example/model.kmz" },
    });
    expect(summary.available).toBe(true);
    expect(summary.detailedModelAvailable).toBe(true);
  });

  it("recognizes multiple active LOD models from the map API", () => {
    const summary = getAsset3dSummary({
      active_model_3d: null,
      active_models_3d: [
        {
          id_model_3d: 11,
          lod: "LOD1",
          converted_public_url: "https://storage.example/lod1.glb",
        },
        {
          id_model_3d: 12,
          lod: "LOD2",
          converted_public_url: "https://storage.example/lod2.glb",
        },
      ],
    });

    expect(summary.available).toBe(true);
    expect(summary.detailedModelAvailable).toBe(true);
  });
});
