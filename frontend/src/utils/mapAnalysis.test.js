import { describe, expect, it } from "vitest";
import {
  buildAnalysisFeatureCollection,
  distanceMeters,
  formatMetricValue,
  geometryAreaSquareMeters,
  lineDistanceMeters,
} from "./mapAnalysis";

describe("map analysis utilities", () => {
  it("calculates distance between coordinates", () => {
    const distance = distanceMeters([112.9, -7.64], [112.901, -7.64]);
    expect(distance).toBeGreaterThan(100);
    expect(distance).toBeLessThan(120);
    expect(lineDistanceMeters([[112.9, -7.64], [112.901, -7.64]])).toBe(distance);
  });

  it("calculates polygon area and subtracts holes", () => {
    const geometry = {
      type: "Polygon",
      coordinates: [
        [[0, 0], [0.001, 0], [0.001, 0.001], [0, 0.001], [0, 0]],
        [[0.0004, 0.0004], [0.0006, 0.0004], [0.0006, 0.0006], [0.0004, 0.0006], [0.0004, 0.0004]],
      ],
    };
    expect(geometryAreaSquareMeters(geometry)).toBeGreaterThan(11000);
    expect(geometryAreaSquareMeters(geometry)).toBeLessThan(12500);
  });

  it("builds visible map features and formats metric values", () => {
    const collection = buildAnalysisFeatureCollection({
      points: [[112.9, -7.64], [112.901, -7.64]],
    });
    expect(collection.features).toHaveLength(3);
    expect(formatMetricValue(1250, "m")).toBe("1,25 km");
  });
});
