import { Op } from "sequelize";
import { Riwayat, User } from "../models/index.js";

/**
 * Get activity history with pagination
 * GET /api/riwayat
 */
export const getAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      aksi,
      tabel,
      startDate,
      endDate,
      user_id,
      sort = "created_at",
      order = "DESC",
    } = req.query;

    // Build where clause
    const where = {};

    if (aksi) where.aksi = aksi;
    if (tabel) where.tabel = tabel;
    if (user_id) where.user_id = user_id;

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = new Date(startDate);
      if (endDate) where.created_at[Op.lte] = new Date(endDate + "T23:59:59");
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: riwayat } = await Riwayat.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sort, order.toUpperCase()]],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id_user", "nama_lengkap", "username", "role"],
        },
      ],
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      success: true,
      data: riwayat,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching riwayat:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get activity statistics
 * GET /api/riwayat/stats
 */
export const getStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = new Date(startDate);
      if (endDate) where.created_at[Op.lte] = new Date(endDate + "T23:59:59");
    }

    const totalActivities = await Riwayat.count({ where });

    const byAksi = await Riwayat.findAll({
      where,
      attributes: [
        "aksi",
        [Riwayat.sequelize.fn("COUNT", Riwayat.sequelize.col("aksi")), "count"],
      ],
      group: ["aksi"],
    });

    const byTabel = await Riwayat.findAll({
      where,
      attributes: [
        "tabel",
        [
          Riwayat.sequelize.fn("COUNT", Riwayat.sequelize.col("tabel")),
          "count",
        ],
      ],
      group: ["tabel"],
    });

    // Get recent activities (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivities = await Riwayat.findAll({
      where: {
        created_at: { [Op.gte]: sevenDaysAgo },
      },
      attributes: [
        [
          Riwayat.sequelize.fn("DATE", Riwayat.sequelize.col("created_at")),
          "date",
        ],
        [Riwayat.sequelize.fn("COUNT", "*"), "count"],
      ],
      group: [
        Riwayat.sequelize.fn("DATE", Riwayat.sequelize.col("created_at")),
      ],
      order: [
        [
          Riwayat.sequelize.fn("DATE", Riwayat.sequelize.col("created_at")),
          "ASC",
        ],
      ],
    });

    res.json({
      success: true,
      data: {
        totalActivities,
        byAksi: byAksi.reduce((acc, item) => {
          acc[item.aksi] = parseInt(item.dataValues.count);
          return acc;
        }, {}),
        byTabel: byTabel.reduce((acc, item) => {
          acc[item.tabel] = parseInt(item.dataValues.count);
          return acc;
        }, {}),
        recentActivities: recentActivities.map((item) => ({
          date: item.dataValues.date,
          count: parseInt(item.dataValues.count),
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching riwayat stats:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get history for specific asset
 * GET /api/riwayat/aset/:asetId
 */
export const getByAset = async (req, res) => {
  try {
    const { asetId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: riwayat } = await Riwayat.findAndCountAll({
      where: {
        tabel: "aset",
        id_referensi: asetId,
      },
      limit: parseInt(limit),
      offset,
      order: [["created_at", "DESC"]],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id_user", "nama_lengkap", "username", "role"],
        },
      ],
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      success: true,
      data: riwayat,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching asset history:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get history by user
 * GET /api/riwayat/user/:userId
 */
export const getByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: riwayat } = await Riwayat.findAndCountAll({
      where: { user_id: userId },
      limit: parseInt(limit),
      offset,
      order: [["created_at", "DESC"]],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id_user", "nama_lengkap", "username", "role"],
        },
      ],
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      success: true,
      data: riwayat,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching user history:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get single riwayat by ID
 * GET /api/riwayat/:id
 */
export const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const riwayat = await Riwayat.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id_user", "nama_lengkap", "username", "role"],
        },
      ],
    });

    if (!riwayat) {
      return res.status(404).json({
        success: false,
        error: "Riwayat tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: riwayat,
    });
  } catch (error) {
    console.error("Error fetching riwayat:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
