import { afterEach, describe, expect, it, vi } from "vitest";
import { buildReloadUrl, loadWithTimeout } from "./lazyWithRetry";

describe("lazy route recovery", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("preserves the hash route when adding a reload token", () => {
    const url = buildReloadUrl(
      "https://bhumisatya.web.id/?mode=public#/beranda",
      "build-123",
    );

    expect(url).toBe(
      "https://bhumisatya.web.id/?mode=public&bs_reload=build-123#/beranda",
    );
  });

  it("resolves a component import before the timeout", async () => {
    await expect(
      loadWithTimeout(() => Promise.resolve({ default: "Page" }), 100),
    ).resolves.toEqual({ default: "Page" });
  });

  it("rejects a stalled component import instead of waiting forever", async () => {
    vi.useFakeTimers();
    const result = loadWithTimeout(() => new Promise(() => {}), 100);
    const expectation = expect(result).rejects.toThrow(
      "Waktu pemuatan halaman habis.",
    );

    await vi.advanceTimersByTimeAsync(100);
    await expectation;
  });
});
