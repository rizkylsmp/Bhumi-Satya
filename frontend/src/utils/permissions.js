/**
 * Role-based permission utility
 * Centralized permission checking for UI/UX.
 *
 * Role menyatakan fungsi kerja, bukan instansi. Instansi pengguna tetap
 * disimpan terpisah untuk identitas dan audit.
 */

export const ROLES = {
  ADMIN: "admin",
  PENGELOLA_ASET: "pengelola_aset",
  VERIFIKATOR_ASET: "verifikator_aset",
  VIEWER: "viewer",
  MASYARAKAT: "masyarakat",
};

const EMPTY_PERMISSIONS = Object.freeze({});

const INTERNAL_READ = {
  dashboard: { view: true, full: false },
  aset: { view: true, create: false, update: false, delete: false },
  asetSubstansi: {
    legal: false,
    fisik: false,
    administratif: false,
    spasial: false,
  },
  pusatData: { view: true, create: false, update: false, delete: false },
  kelola3d: { view: true, update: false },
  peta: { view: true, allLayers: true },
  riwayat: { view: false, full: false },
  notifikasi: { view: true },
  ekasmat: { view: true },
  user: { view: false, create: false, update: false, delete: false },
  backup: { view: false, create: false, restore: false },
  pengaturan: { view: false, edit: false },
  sewaAset: { view: false, create: false, update: false, delete: false },
  sewaMasyarakat: { view: false },
  profil: { view: true, edit: true },
};

const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    ...INTERNAL_READ,
    dashboard: { view: true, full: true },
    aset: { view: true, create: true, update: true, delete: true },
    asetSubstansi: {
      legal: true,
      fisik: true,
      administratif: true,
      spasial: true,
    },
    pusatData: { view: true, create: true, update: true, delete: true },
    kelola3d: { view: true, update: true },
    riwayat: { view: true, full: true },
    user: { view: true, create: true, update: true, delete: true },
    backup: { view: true, create: true, restore: true },
    pengaturan: { view: true, edit: true },
    sewaAset: { view: true, create: true, update: true, delete: true },
  },
  [ROLES.PENGELOLA_ASET]: {
    ...INTERNAL_READ,
    dashboard: { view: true, full: true },
    aset: { view: true, create: true, update: true, delete: true },
    pusatData: { view: true, create: true, update: true, delete: true },
    kelola3d: { view: true, update: true },
    riwayat: { view: true, full: false },
    sewaAset: { view: true, create: true, update: true, delete: true },
  },
  [ROLES.VERIFIKATOR_ASET]: {
    ...INTERNAL_READ,
    aset: { view: true, create: false, update: true, delete: false },
    asetSubstansi: {
      legal: true,
      fisik: true,
      administratif: true,
      spasial: true,
    },
    pusatData: { view: true, create: false, update: true, delete: false },
    kelola3d: { view: true, update: true },
  },
  [ROLES.VIEWER]: INTERNAL_READ,
  [ROLES.MASYARAKAT]: {
    dashboard: { view: false, full: false },
    aset: { view: false, create: false, update: false, delete: false },
    asetSubstansi: {
      legal: false,
      fisik: false,
      administratif: false,
      spasial: false,
    },
    pusatData: { view: false, create: false, update: false, delete: false },
    kelola3d: { view: false, update: false },
    peta: { view: false, allLayers: false },
    riwayat: { view: false, full: false },
    notifikasi: { view: false },
    ekasmat: { view: false },
    user: { view: false, create: false, update: false, delete: false },
    backup: { view: false, create: false, restore: false },
    pengaturan: { view: false, edit: false },
    sewaAset: { view: false, create: false, update: false, delete: false },
    sewaMasyarakat: { view: true },
    profil: { view: true, edit: true },
  },
};

export const normalizeRole = (role) => {
  const normalized = role?.toLowerCase()?.trim() || "";
  return ROLE_PERMISSIONS[normalized] ? normalized : "";
};

export const getPermissions = (role) => {
  const normalizedRole = normalizeRole(role);
  return ROLE_PERMISSIONS[normalizedRole] || EMPTY_PERMISSIONS;
};

export const hasPermission = (role, module, action = "view") => {
  const permissions = getPermissions(role);
  return permissions[module]?.[action] ?? false;
};

export const canAccessMenu = (role, menuId) => {
  const permissions = getPermissions(role);

  switch (menuId) {
    case "dashboard":
      return permissions.dashboard?.view;
    case "aset":
      return permissions.aset?.view;
    case "pusatData":
      return permissions.pusatData?.view;
    case "kelola3d":
      return permissions.kelola3d?.view;
    case "peta":
      return permissions.peta?.view;
    case "riwayat":
      return permissions.riwayat?.view;
    case "notifikasi":
      return permissions.notifikasi?.view;
    case "ekasmat":
      return permissions.ekasmat?.view;
    case "user":
      return permissions.user?.view;
    case "pengaturan":
      return permissions.pengaturan?.view;
    case "backup":
      return permissions.backup?.view;
    case "profil":
      return permissions.profil?.view;
    case "sewa-aset":
      return permissions.sewaAset?.view;
    case "sewa-masyarakat":
      return permissions.sewaMasyarakat?.view;
    default:
      return false;
  }
};

export const getFilteredMenuItems = (role, menuItems) => {
  return menuItems.filter((item) => canAccessMenu(role, item.id));
};

export const isAdmin = (role) => normalizeRole(role) === ROLES.ADMIN;

export const canModifyAset = (role) => {
  const permissions = getPermissions(role);
  return (
    permissions.aset?.create ||
    permissions.aset?.update ||
    permissions.aset?.delete
  );
};

export const canAccessSubstansi = (role, substansi) => {
  const permissions = getPermissions(role);
  return permissions.asetSubstansi?.[substansi] ?? false;
};

export const getRoleDisplayName = (role) => {
  const names = {
    [ROLES.ADMIN]: "Admin",
    [ROLES.PENGELOLA_ASET]: "Pengelola Aset",
    [ROLES.VERIFIKATOR_ASET]: "Verifikator Aset",
    [ROLES.VIEWER]: "Viewer",
    [ROLES.MASYARAKAT]: "Masyarakat",
  };
  return names[normalizeRole(role)] || role;
};

export const getRoleBadgeColor = (role) => {
  const colors = {
    [ROLES.ADMIN]:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    [ROLES.PENGELOLA_ASET]:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    [ROLES.VERIFIKATOR_ASET]:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    [ROLES.VIEWER]:
      "bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400",
    [ROLES.MASYARAKAT]:
      "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400",
  };
  return (
    colors[normalizeRole(role)] ||
    "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400"
  );
};
