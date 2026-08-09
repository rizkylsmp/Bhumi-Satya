import { describe, expect, it, vi } from "vitest";
import { checkForBuildUpdate } from "./buildVersion";

const createBuildResponse = (buildId) =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ buildId }),
  });

describe("build version detection", () => {
  it("keeps the current page when the deployed build is unchanged", async () => {
    const replace = vi.fn();
    const result = await checkForBuildUpdate({
      currentBuildId: "commit-a",
      fetchImpl: () => createBuildResponse("commit-a"),
      href: "https://bhumisatya.web.id/#/beranda",
      replace,
    });

    expect(result.hasUpdate).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });

  it("reloads with a unique document URL when a new build is deployed", async () => {
    const replace = vi.fn();
    const result = await checkForBuildUpdate({
      currentBuildId: "commit-a",
      fetchImpl: () => createBuildResponse("commit-b"),
      href: "https://bhumisatya.web.id/#/peta-publik",
      replace,
    });

    expect(result.hasUpdate).toBe(true);
    expect(replace).toHaveBeenCalledWith(
      "https://bhumisatya.web.id/?bs_reload=commit-b#/peta-publik",
    );
  });
});
