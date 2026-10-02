import { describe, expect, it } from "vitest";
import { ROLES, canAccessMenu, canAccessSubstansi, getFilteredMenuItems, getRoleDisplayName, hasPermission, normalizeRole } from "./permissions";

describe("admin-only permissions", () => {
  it("only defines admin and grants management access", () => {
    expect(Object.values(ROLES)).toEqual(["admin"]);
    expect(normalizeRole(" ADMIN ")).toBe("admin");
    for (const menu of ["dashboard", "aset", "pusatData", "kelola3d", "peta", "riwayat", "notifikasi", "user", "pengaturan", "backup", "profil", "sewa-aset"]) {
      expect(canAccessMenu("admin", menu)).toBe(true);
    }
    expect(hasPermission("admin", "aset", "delete")).toBe(true);
    expect(canAccessSubstansi("admin", "legal")).toBe(true);
    expect(getRoleDisplayName("ADMIN")).toBe("Admin");
  });
  it("does not grant access to removed or unknown roles", () => {
    for (const role of ["masyarakat", "viewer", "pengelola_aset", "verifikator_aset", "unknown", undefined]) {
      expect(normalizeRole(role)).toBe("");
      expect(hasPermission(role, "aset", "view")).toBe(false);
      expect(getFilteredMenuItems(role, [{ id: "user" }])).toEqual([]);
    }
  });
});
