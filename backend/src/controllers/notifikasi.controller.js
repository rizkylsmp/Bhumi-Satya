import { Op } from "sequelize";
import { Notifikasi } from "../models/index.js";

function isMissingNotificationTableError(error) {
  return (
    error?.parent?.code === "42P01" ||
    error?.original?.code === "42P01" ||
    /relation ["']?notifikasi["']? does not exist/i.test(error?.message || "")
  );
}

/**
 * Get all notifications for current user
 * GET /api/notifikasi
 */
export const getAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      unreadOnly = "false",
      kategori,
      sort = "created_at",
      order = "DESC",
    } = req.query;

    const where = { user_id: req.user.id_user };

    if (unreadOnly === "true") where.dibaca = false;
    if (kategori) where.kategori = kategori;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: notifications } = await Notifikasi.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sort, order.toUpperCase()]],
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      success: true,
      data: notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get unread notification count
 * GET /api/notifikasi/unread-count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notifikasi.count({
      where: {
        user_id: req.user.id_user,
        dibaca: false,
      },
    });

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get recent notifications
 * GET /api/notifikasi/recent
 */
export const getRecent = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const notifications = await Notifikasi.findAll({
      where: { user_id: req.user.id_user },
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
    });

    const unreadCount = await Notifikasi.count({
      where: {
        user_id: req.user.id_user,
        dibaca: false,
      },
    });

    res.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching recent notifications:", error);
    if (isMissingNotificationTableError(error)) {
      return res.json({
        success: true,
        data: [],
        unreadCount: 0,
      });
    }
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Mark all notifications as read
 * PUT /api/notifikasi/read-all
 */
export const markAllAsRead = async (req, res) => {
  try {
    const [updatedCount] = await Notifikasi.update(
      {
        dibaca: true,
        dibaca_at: new Date(),
      },
      {
        where: {
          user_id: req.user.id_user,
          dibaca: false,
        },
      }
    );

    res.json({
      success: true,
      message: "Semua notifikasi ditandai sudah dibaca",
      data: { updatedCount },
    });
  } catch (error) {
    console.error("Error marking all as read:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Mark single notification as read
 * PUT /api/notifikasi/:id/read
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notifikasi = await Notifikasi.findOne({
      where: {
        id_notifikasi: id,
        user_id: req.user.id_user,
      },
    });

    if (!notifikasi) {
      return res.status(404).json({
        success: false,
        error: "Notifikasi tidak ditemukan",
      });
    }

    await notifikasi.update({
      dibaca: true,
      dibaca_at: new Date(),
    });

    res.json({
      success: true,
      message: "Notifikasi ditandai sudah dibaca",
      data: notifikasi,
    });
  } catch (error) {
    console.error("Error marking as read:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Delete single notification
 * DELETE /api/notifikasi/:id
 */
export const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const notifikasi = await Notifikasi.findOne({
      where: {
        id_notifikasi: id,
        user_id: req.user.id_user,
      },
    });

    if (!notifikasi) {
      return res.status(404).json({
        success: false,
        error: "Notifikasi tidak ditemukan",
      });
    }

    await notifikasi.destroy();

    res.json({
      success: true,
      message: "Notifikasi berhasil dihapus",
      data: { id_notifikasi: parseInt(id) },
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Clear all notifications for user
 * DELETE /api/notifikasi/clear-all
 */
export const clearAll = async (req, res) => {
  try {
    const deletedCount = await Notifikasi.destroy({
      where: { user_id: req.user.id_user },
    });

    res.json({
      success: true,
      message: "Semua notifikasi berhasil dihapus",
      data: { deletedCount },
    });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
