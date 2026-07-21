import { describe, expect, it } from "vitest";
import {
  ROLES,
  canAccessMenu,
  canAccessSubstansi,
  getFilteredMenuItems,
  getRoleDisplayName,
  hasPermission,
  isAdmin,
  normalizeRole,
} from "./permissions";

describe("permission utilities", () => {
  it("normalizes roles defensively and falls back to the least privileged role", () => {
    expect(normalizeRole(" ADMIN ")).toBe(ROLES.ADMIN);
    expect(normalizeRole(undefined)).toBe("");
  });

  it("allows pengelola aset to manage sewa aset but keeps verifikator scoped to asset updates", () => {
    expect(canAccessMenu("pengelola_aset", "sewa-aset")).toBe(true);
    expect(hasPermission("pengelola_aset", "sewaAset", "create")).toBe(true);

    expect(hasPermission("verifikator_aset", "aset", "view")).toBe(true);
    expect(hasPermission("verifikator_aset", "aset", "create")).toBe(false);
    expect(hasPermission("verifikator_aset", "aset", "delete")).toBe(false);
  });

  it("limits administrative menus to admin roles", () => {
    expect(isAdmin("admin")).toBe(true);
    [
      "dashboard",
      "aset",
      "pusatData",
      "kelola3d",
      "peta",
      "riwayat",
      "notifikasi",
      "ekasmat",
      "user",
      "pengaturan",
      "backup",
      "profil",
      "sewa-aset",
    ].forEach((menu) => expect(canAccessMenu("admin", menu)).toBe(true));
    expect(canAccessMenu("pengelola_aset", "backup")).toBe(false);
    expect(canAccessMenu("verifikator_aset", "user")).toBe(false);
  });

  it("filters menu items according to the active role", () => {
    const menuItems = [
      { id: "dashboard", label: "Dashboard" },
      { id: "backup", label: "Backup" },
      { id: "sewa-aset", label: "Sewa Aset" },
    ];

    expect(getFilteredMenuItems("pengelola_aset", menuItems).map((item) => item.id)).toEqual([
      "dashboard",
      "sewa-aset",
    ]);
  });

  it("gives every internal functional role the same unified asset workspace", () => {
    [ROLES.ADMIN, ROLES.PENGELOLA_ASET, ROLES.VERIFIKATOR_ASET, ROLES.VIEWER].forEach(
      (role) => {
        expect(canAccessMenu(role, "aset")).toBe(true);
        expect(canAccessMenu(role, "pusatData")).toBe(true);
        expect(canAccessMenu(role, "kelola3d")).toBe(true);
        expect(canAccessMenu(role, "peta")).toBe(true);
      },
    );

    expect(canAccessMenu(ROLES.MASYARAKAT, "aset")).toBe(false);
    expect(canAccessMenu(ROLES.MASYARAKAT, "kelola3d")).toBe(false);
    expect(hasPermission(ROLES.VIEWER, "kelola3d", "update")).toBe(false);
    expect(hasPermission(ROLES.VERIFIKATOR_ASET, "kelola3d", "update")).toBe(true);
  });

  it("exposes verifikator substansi access and readable display names", () => {
    expect(canAccessSubstansi("verifikator_aset", "legal")).toBe(true);
    expect(canAccessSubstansi("pengelola_aset", "legal")).toBe(false);
    expect(getRoleDisplayName("ADMIN")).toBe("Admin");
  });

  it("limits masyarakat to the approved rental menu and profile", () => {
    expect(canAccessMenu("masyarakat", "sewa-masyarakat")).toBe(true);
    expect(canAccessMenu("masyarakat", "dashboard")).toBe(false);
    expect(canAccessMenu("masyarakat", "aset")).toBe(false);
    expect(hasPermission("masyarakat", "profil", "view")).toBe(true);
    expect(getRoleDisplayName("MASYARAKAT")).toBe("Masyarakat");
  });
});
