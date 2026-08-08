import { describe, expect, it } from "vitest";
import {
  createJakartaShadowDateTime,
  formatShadowMinutes,
  getJakartaDateTimeParts,
  getShadowDayPeriod,
} from "./shadowAnalysis";

describe("shadow analysis time", () => {
  it("uses Jakarta time when deriving the current date and time", () => {
    expect(getJakartaDateTimeParts(new Date("2026-08-08T01:30:00Z"))).toEqual({
      date: "2026-08-08",
      minutes: 8 * 60 + 30,
    });
  });

  it("creates an absolute simulation time using UTC+7", () => {
    expect(
      createJakartaShadowDateTime("2026-08-08", 16 * 60 + 7)?.toISOString(),
    ).toBe("2026-08-08T09:07:00.000Z");
  });

  it("formats and classifies slider values", () => {
    expect(formatShadowMinutes(967)).toBe("16:07");
    expect(getShadowDayPeriod(967)).toBe("Sore");
  });
});

