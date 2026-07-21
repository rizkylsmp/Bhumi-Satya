import jwt from "jsonwebtoken";

export const ROLES = {
  ADMIN: "admin",
  PENGELOLA_ASET: "pengelola_aset",
  VERIFIKATOR_ASET: "verifikator_aset",
  VIEWER: "viewer",
  MASYARAKAT: "masyarakat",
};

// Permission constants
export const PERMISSIONS = {
  // Aset Management
  ASET_CREATE: "aset:create",
  ASET_READ: "aset:read",
  ASET_READ_ALL: "aset:read_all",
  ASET_UPDATE: "aset:update",
  ASET_DELETE: "aset:delete",

  // Peta/Map Layers
  PETA_VIEW: "peta:view",
  LAYER_UMUM: "layer:umum",
  LAYER_TATA_RUANG: "layer:tata_ruang",
  LAYER_POTENSI_BERPERKARA: "layer:potensi_berperkara",
  LAYER_SEBARAN_PERKARA: "layer:sebaran_perkara",

// System Features
  RIWAYAT_VIEW: "riwayat:view",
  NOTIFIKASI_VIEW: "notifikasi:view",
  BACKUP_MANAGE: "backup:manage",
  USER_MANAGE: "user:manage",

  // Public user features
  SEWA_APPROVED_VIEW: "sewa:approved_view",

  // Dashboard
  DASHBOARD_FULL: "dashboard:full",
  DASHBOARD_LIMITED: "dashboard:limited",
};

const INTERNAL_READ_PERMISSIONS = [
  PERMISSIONS.ASET_READ,
  PERMISSIONS.ASET_READ_ALL,
  PERMISSIONS.PETA_VIEW,
  PERMISSIONS.LAYER_UMUM,
  PERMISSIONS.LAYER_TATA_RUANG,
  PERMISSIONS.LAYER_POTENSI_BERPERKARA,
  PERMISSIONS.LAYER_SEBARAN_PERKARA,
  PERMISSIONS.NOTIFIKASI_VIEW,
];

const ASSET_WRITE_PERMISSIONS = [
  PERMISSIONS.ASET_CREATE,
  PERMISSIONS.ASET_UPDATE,
  PERMISSIONS.ASET_DELETE,
];

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

// Role-Permission mapping fungsional. Instansi disimpan di user.instansi
// untuk identitas/audit, bukan untuk menentukan permission.
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: ALL_PERMISSIONS,

  [ROLES.PENGELOLA_ASET]: [
    ...INTERNAL_READ_PERMISSIONS,
    ...ASSET_WRITE_PERMISSIONS,
    PERMISSIONS.RIWAYAT_VIEW,
    PERMISSIONS.DASHBOARD_FULL,
    PERMISSIONS.SEWA_APPROVED_VIEW,
  ],

  [ROLES.VERIFIKATOR_ASET]: [
    ...INTERNAL_READ_PERMISSIONS,
    PERMISSIONS.ASET_UPDATE,
    PERMISSIONS.DASHBOARD_LIMITED,
  ],

  [ROLES.VIEWER]: [
    ...INTERNAL_READ_PERMISSIONS,
    PERMISSIONS.DASHBOARD_LIMITED,
  ],

  [ROLES.MASYARAKAT]: [
    PERMISSIONS.SEWA_APPROVED_VIEW,
  ],
};

// ===========================================
// MIDDLEWARE FUNCTIONS
// ===========================================

const normalizeRole = (role) => role?.toLowerCase()?.trim() || "";

const getBearerToken = (req) => {
  const authorization = req.headers.authorization;
  if (!authorization) return null;

  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
};

/**
 * Authentication middleware - verify JWT token
 */
export const authMiddleware = (req, res, next) => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({ error: "Token tidak ditemukan" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Normalize role to lowercase for permission checking
    const normalizedRole = normalizeRole(decoded.role);
    req.user.normalizedRole = normalizedRole;

    // Attach user permissions
    req.user.permissions = ROLE_PERMISSIONS[normalizedRole] || [];

    next();
  } catch (error) {
    res.status(401).json({ error: "Token tidak valid atau sudah expired" });
  }
};

/**
 * Allow expired tokens within a grace period (for refresh-token endpoint)
 * Accepts tokens expired up to 5 minutes ago
 */
export const expiredTokenMiddleware = (req, res, next) => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({ error: "Token tidak ditemukan" });
    }

    // First try normal verification
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // If expired, decode ignoring expiration but check grace period
      if (err.name === "TokenExpiredError") {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
          ignoreExpiration: true,
        });
        // Allow up to 5 minutes after expiry
        const expiredAt = decoded.exp * 1000;
        const gracePeriod = 5 * 60 * 1000;
        if (Date.now() - expiredAt > gracePeriod) {
          return res
            .status(401)
            .json({ error: "Token sudah expired terlalu lama" });
        }
        req.user = decoded;
      } else {
        throw err;
      }
    }

    const normalizedRole = normalizeRole(req.user.role);
    req.user.normalizedRole = normalizedRole;
    req.user.permissions = ROLE_PERMISSIONS[normalizedRole] || [];

    next();
  } catch (error) {
    res.status(401).json({ error: "Token tidak valid" });
  }
};

/**
 * Role-based middleware - check if user has one of allowed roles
 */
export const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Use normalized role for comparison
    const userRole = req.user.normalizedRole || normalizeRole(req.user.role);
    const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

    if (!normalizedAllowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: "Akses ditolak",
        message: `Role '${req.user.role}' tidak memiliki akses ke resource ini`,
        requiredRoles: allowedRoles,
      });
    }
    next();
  };
};

/**
 * Permission-based middleware - check if user has required permission
 */
export const permissionMiddleware = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userRole = req.user.normalizedRole || normalizeRole(req.user.role);
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    const hasPermission = requiredPermissions.every((perm) =>
      userPermissions.includes(perm),
    );

    if (!hasPermission) {
      return res.status(403).json({
        error: "Akses ditolak",
        message: "Anda tidak memiliki izin untuk melakukan aksi ini",
        requiredPermissions,
      });
    }
    next();
  };
};

/**
 * Check if user has ANY of the required permissions
 */
export const anyPermissionMiddleware = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userRole = req.user.normalizedRole || normalizeRole(req.user.role);
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    const hasAnyPermission = requiredPermissions.some((perm) =>
      userPermissions.includes(perm),
    );

    if (!hasAnyPermission) {
      return res.status(403).json({
        error: "Akses ditolak",
        message: "Anda tidak memiliki izin untuk melakukan aksi ini",
      });
    }
    next();
  };
};

/**
 * Helper to check permission in code (not middleware)
 */
export const hasPermission = (role, permission) => {
  const normalizedRole = normalizeRole(role);
  const permissions = ROLE_PERMISSIONS[normalizedRole] || [];
  return permissions.includes(permission);
};

/**
 * Helper to get all permissions for a role
 */
export const getPermissions = (role) => {
  const normalizedRole = normalizeRole(role);
  return ROLE_PERMISSIONS[normalizedRole] || [];
};

export const getRolesWithPermission = (permission) =>
  Object.entries(ROLE_PERMISSIONS)
    .filter(([, permissions]) => permissions.includes(permission))
    .map(([role]) => role);

// ===========================================
// PRESET MIDDLEWARE COMBINATIONS
// ===========================================

// Hanya user dengan permission administrasi
export const adminOnly = permissionMiddleware(PERMISSIONS.USER_MANAGE);

// User yang bisa CRUD aset penuh
export const canManageAset = permissionMiddleware(
  PERMISSIONS.ASET_CREATE,
  PERMISSIONS.ASET_UPDATE,
  PERMISSIONS.ASET_DELETE,
);

// User yang bisa update aset
export const canUpdateAset = permissionMiddleware(PERMISSIONS.ASET_UPDATE);

// Semua role internal bisa melihat aset
export const canViewAset = permissionMiddleware(PERMISSIONS.ASET_READ);

// Role yang bisa melihat data detail/lengkap
export const canViewFullData = permissionMiddleware(PERMISSIONS.ASET_READ_ALL);

// Role yang bisa melihat riwayat
export const canViewRiwayat = permissionMiddleware(PERMISSIONS.RIWAYAT_VIEW);

// Role yang bisa backup/restore
export const canBackup = permissionMiddleware(PERMISSIONS.BACKUP_MANAGE);

// Role yang bisa manage users
export const canManageUsers = permissionMiddleware(PERMISSIONS.USER_MANAGE);
