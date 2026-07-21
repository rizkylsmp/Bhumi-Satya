import { Op } from "sequelize";
import { User } from "../models/index.js";
import AuditService from "../services/audit.service.js";
import {
  ROLE_PERMISSIONS,
  getPermissions,
} from "../middleware/auth.middleware.js";

/**
 * Get all users with pagination
 * GET /api/users
 */
export const getAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      status,
      sort = "created_at",
      order = "DESC",
    } = req.query;

    // Build where clause
    const where = {};

    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { nama_lengkap: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (role) where.role = role;
    if (status !== undefined) {
      where.status_aktif = status === "true" || status === true;
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ["password"] },
      limit: parseInt(limit),
      offset,
      order: [[sort, order.toUpperCase()]],
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get user statistics
 * GET /api/users/stats
 */
export const getStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { status_aktif: true } });
    const inactiveUsers = await User.count({ where: { status_aktif: false } });

    const byRole = await User.findAll({
      attributes: [
        "role",
        [User.sequelize.fn("COUNT", User.sequelize.col("role")), "count"],
      ],
      group: ["role"],
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        byRole: byRole.reduce((acc, item) => {
          acc[item.role] = parseInt(item.dataValues.count);
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get available roles with permissions
 * GET /api/users/roles
 */
export const getRoles = async (req, res) => {
  try {
    const roles = Object.keys(ROLE_PERMISSIONS).map((role) => ({
      role,
      permissions: ROLE_PERMISSIONS[role],
      permissionCount: ROLE_PERMISSIONS[role].length,
    }));

    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get user by ID
 * GET /api/users/:id
 */
export const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: user,
      permissions: getPermissions(user.role),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Create new user
 * POST /api/users
 */
export const create = async (req, res) => {
  try {
    const { username, password, nama_lengkap, role, instansi } = req.body;
    const email = req.body.email?.trim() || null;

    // Validate required fields
    if (!username || !password || !nama_lengkap || !role) {
      return res.status(400).json({
        success: false,
        error: "Username, password, nama lengkap, dan role wajib diisi",
      });
    }

    // Check if username exists
    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Username sudah digunakan",
      });
    }

    // Validate role
    if (!ROLE_PERMISSIONS[role]) {
      return res.status(400).json({
        success: false,
        error: "Role tidak valid",
        validRoles: Object.keys(ROLE_PERMISSIONS),
      });
    }

    const user = await User.create({
      username,
      password,
      nama_lengkap,
      email,
      role,
      instansi,
      status_aktif: true,
    });

    // Log audit
    await AuditService.logCreate({
      tabel: "users",
      id_referensi: user.id_user,
      data_baru: {
        id_user: user.id_user,
        username,
        nama_lengkap,
        role,
        email,
      },
      keterangan: `Membuat user baru: ${username}`,
      user_id: req.user.id_user,
      req,
    });

    res.status(201).json({
      success: true,
      message: "User berhasil dibuat",
      data: {
        id_user: user.id_user,
        username: user.username,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Update user
 * PUT /api/users/:id
 */
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, nama_lengkap, role, instansi, status_aktif } = req.body;
    const email = req.body.email?.trim() || null;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User tidak ditemukan",
      });
    }

    // Validate role if provided
    if (role && !ROLE_PERMISSIONS[role]) {
      return res.status(400).json({
        success: false,
        error: "Role tidak valid",
        validRoles: Object.keys(ROLE_PERMISSIONS),
      });
    }

    // Check if new username is already taken by another user
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ where: { username } });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          error: "Username sudah digunakan",
        });
      }
    }

    // Store old data for audit
    const oldData = {
      username: user.username,
      nama_lengkap: user.nama_lengkap,
      email: user.email,
      role: user.role,
      instansi: user.instansi,
      status_aktif: user.status_aktif,
    };

    await user.update({
      username: username || user.username,
      nama_lengkap: nama_lengkap || user.nama_lengkap,
      email: email !== undefined ? email : user.email,
      role: role || user.role,
      instansi: instansi !== undefined ? instansi : user.instansi,
      status_aktif:
        status_aktif !== undefined ? status_aktif : user.status_aktif,
    });

    // Log audit
    await AuditService.logUpdate({
      tabel: "users",
      id_referensi: parseInt(id),
      data_lama: oldData,
      data_baru: {
        nama_lengkap: user.nama_lengkap,
        email: user.email,
        role: user.role,
        instansi: user.instansi,
        status_aktif: user.status_aktif,
      },
      keterangan: `Memperbarui user: ${user.username}`,
      user_id: req.user.id_user,
      req,
    });

    res.json({
      success: true,
      message: "User berhasil diupdate",
      data: {
        id_user: user.id_user,
        username: user.username,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        email: user.email,
        status_aktif: user.status_aktif,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Reset user password
 * PUT /api/users/:id/password
 */
export const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password minimal 6 karakter",
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User tidak ditemukan",
      });
    }

    user.password = newPassword;
    await user.save();

    // Log audit
    await AuditService.logUpdate({
      tabel: "users",
      id_referensi: parseInt(id),
      data_baru: { password_changed: true },
      keterangan: `Reset password user: ${user.username}`,
      user_id: req.user.id_user,
      req,
    });

    res.json({
      success: true,
      message: "Password berhasil direset",
      data: { id_user: user.id_user },
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Delete user
 * DELETE /api/users/:id
 */
export const remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.user.id_user) {
      return res.status(400).json({
        success: false,
        error: "Tidak dapat menghapus akun sendiri",
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User tidak ditemukan",
      });
    }

    // Store data for audit
    const deletedData = {
      id_user: user.id_user,
      username: user.username,
      nama_lengkap: user.nama_lengkap,
      role: user.role,
    };

    await user.destroy();

    // Log audit
    await AuditService.logDelete({
      tabel: "users",
      id_referensi: parseInt(id),
      data_lama: deletedData,
      keterangan: `Menghapus user: ${deletedData.username}`,
      user_id: req.user.id_user,
      req,
    });

    res.json({
      success: true,
      message: "User berhasil dihapus",
      data: { id_user: parseInt(id) },
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Toggle user active status
 * PUT /api/users/:id/toggle-status
 */
export const toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deactivation
    if (parseInt(id) === req.user.id_user) {
      return res.status(400).json({
        success: false,
        error: "Tidak dapat menonaktifkan akun sendiri",
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User tidak ditemukan",
      });
    }

    const oldStatus = user.status_aktif;
    user.status_aktif = !user.status_aktif;
    await user.save();

    // Log audit
    await AuditService.logUpdate({
      tabel: "users",
      id_referensi: parseInt(id),
      data_lama: { status_aktif: oldStatus },
      data_baru: { status_aktif: user.status_aktif },
      keterangan: `${
        user.status_aktif ? "Mengaktifkan" : "Menonaktifkan"
      } user: ${user.username}`,
      user_id: req.user.id_user,
      req,
    });

    res.json({
      success: true,
      message: `User berhasil ${
        user.status_aktif ? "diaktifkan" : "dinonaktifkan"
      }`,
      data: {
        id_user: user.id_user,
        status_aktif: user.status_aktif,
      },
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
