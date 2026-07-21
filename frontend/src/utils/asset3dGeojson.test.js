import { describe, expect, it } from "vitest";
import {
  assessBuildingFootprintLocation,
  buildAssetBuildingFeatureCollection,
  getAsset3dSummary,
} from "./asset3dGeojson";

const footprint = [[-7.64, 112.9], [-7.64, 112.901], [-7.641, 112.901]];

describe("asset3dGeojson", () => {
  it("creates LOD1 feature from measured height", () => {
    const collection = buildAssetBuildingFeatureCollection([
      { id: 1, building_footprint: footprint, building_height_m: 8, building_height_source: "survey" },
    ]);
    expect(collection.features).toHaveLength(1);
    expect(collection.features[0].properties.height_quality).toBe("measured");
  });

  it("marks floor-derived height as estimate", () => {
    const summary = getAsset3dSummary({ building_footprint: footprint, building_floors: 2 });
    expect(summary.height).toBe(7);
    expect(summary.quality).toBe("estimated");
  });

  it("warns when footprint is far from the asset coordinate", () => {
    const result = assessBuildingFootprintLocation({
      building_footprint: footprint,
      koordinat_lat: -7.7,
      koordinat_long: 112.95,
    });
    expect(result.status).toBe("warning");
  });

  it("treats an active detailed model as usable 3D data", () => {
    const summary = getAsset3dSummary({
      active_model_3d: { public_url: "https://storage.example/model.kmz" },
    });
    expect(summary.available).toBe(true);
    expect(summary.detailedModelAvailable).toBe(true);
  });
});
