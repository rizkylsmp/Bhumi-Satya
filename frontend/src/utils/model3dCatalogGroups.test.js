import { describe, expect, it } from "vitest";
import { groupLocationsByArea2d } from "./model3dCatalogGroups";

describe("groupLocationsByArea2d", () => {
  it("groups LOD locations by their 2D area code", () => {
    const groups = groupLocationsByArea2d([
      { id: "model-1", area2dCode: "2D-002", area2dLocation: "Bidang Timur" },
      { id: "model-2", area2dCode: "2D-001", area2dLocation: "Bidang Barat" },
      { id: "model-3", area2dCode: "2D-001", area2dLocation: "Bidang Barat" },
    ]);

    expect(groups.map((group) => group.code)).toEqual(["2D-001", "2D-002"]);
    expect(groups[0].items.map((item) => item.id)).toEqual(["model-2", "model-3"]);
  });

  it("keeps locations without a 2D code in a clear fallback group", () => {
    const groups = groupLocationsByArea2d([
      { id: "model-1", location: "Lokasi lama" },
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      key: "unassigned-2d",
      code: "Tanpa kode 2D",
      location: "Lokasi lama",
    });
  });
});
