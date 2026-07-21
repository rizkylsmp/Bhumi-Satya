import { PusatData, User } from "../models/index.js";
import { Op } from "sequelize";

const PUSAT_DATA_FIELDS = [
  "kode_aset",
  "nama_aset",
  "status",
  "jenis_masalah",
  "jenis_aset",
  "sumber",
  "nib",
  "nomor_hak",
  "jenis_hak",
  "luas",
  "luas_lapangan",
  "batas_utara",
  "batas_selatan",
  "batas_timur",
  "batas_barat",
  "penggunaan",
  "penggunaan_saat_ini",
  "kecamatan",
  "kelurahan",
  "alamat",
  "status_sertifikat",
  "surat_ukur",
  "pemilik_pertama",
  "pemilik_akhir",
  "atas_nama",
  "tanggal_sertifikat",
  "riwayat_perolehan",
  "status_hukum",
  "produk",
  "kw",
  "opd",
  "opd_pengguna",
  "nilai_aset",
  "tahun_perolehan",
  "kode_bmd",
  "nilai_buku",
  "nilai_njop",
  "sk_penetapan",
  "nibar",
  "id_pemda",
  "kode_barang",
  "no_register",
  "luas_kib",
  "harga_perolehan",
  "penggunaan_kib",
  "tanggal_scan",
  "file_sertifikat",
  "notes",
  "plotting_status",
  "koordinat_lat",
  "koordinat_long",
  "polygon_bidang",
  "foto_aset",
  "dokumen_pendukung",
  "keterangan",
];

const pickPusatDataFields = (body) =>
  PUSAT_DATA_FIELDS.reduce((acc, field) => {
    if (body[field] !== undefined) {
      acc[field] = body[field] === "" ? null : body[field];
    }
    return acc;
  }, {});

// Get all pusat data with pagination, search, and filtering
export const getAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      sortBy = "created_at",
      sortOrder = "DESC",
      opd = "",
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (search) {
      where[Op.or] = [
        { kode_aset: { [Op.iLike]: `%${search}%` } },
        { nama_aset: { [Op.iLike]: `%${search}%` } },
        { nib: { [Op.iLike]: `%${search}%` } },
        { nomor_hak: { [Op.iLike]: `%${search}%` } },
        { jenis_hak: { [Op.iLike]: `%${search}%` } },
        { penggunaan: { [Op.iLike]: `%${search}%` } },
        { kecamatan: { [Op.iLike]: `%${search}%` } },
        { kelurahan: { [Op.iLike]: `%${search}%` } },
        { alamat: { [Op.iLike]: `%${search}%` } },
        { opd: { [Op.iLike]: `%${search}%` } },
        { status_sertifikat: { [Op.iLike]: `%${search}%` } },
        { atas_nama: { [Op.iLike]: `%${search}%` } },
        { pemilik_pertama: { [Op.iLike]: `%${search}%` } },
        { pemilik_akhir: { [Op.iLike]: `%${search}%` } },
        { surat_ukur: { [Op.iLike]: `%${search}%` } },
        { keterangan: { [Op.iLike]: `%${search}%` } },
        { status: { [Op.iLike]: `%${search}%` } },
        { jenis_aset: { [Op.iLike]: `%${search}%` } },
        { status_hukum: { [Op.iLike]: `%${search}%` } },
        { kode_bmd: { [Op.iLike]: `%${search}%` } },
        { nibar: { [Op.iLike]: `%${search}%` } },
        { no_register: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (opd) {
      where.opd = { [Op.iLike]: `%${opd}%` };
    }

    const { count, rows } = await PusatData.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id_user", "nama_lengkap", "username"],
        },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error getting pusat data:", error);
    res.status(500).json({ error: "Gagal mengambil data" });
  }
};

// Get pusat data stats
export const getStats = async (req, res) => {
  try {
    const total = await PusatData.count();
    const totalLuas = await PusatData.sum("luas");

    // Count by status sertifikat
    const sertifikatStats = await PusatData.findAll({
      attributes: [
        "status_sertifikat",
        [
          PusatData.sequelize.fn(
            "COUNT",
            PusatData.sequelize.col("id_pusat_data"),
          ),
          "count",
        ],
      ],
      group: ["status_sertifikat"],
      order: [
        [
          PusatData.sequelize.fn(
            "COUNT",
            PusatData.sequelize.col("id_pusat_data"),
          ),
          "DESC",
        ],
      ],
    });

    res.json({
      total,
      totalLuas: totalLuas || 0,
      sertifikatStats,
    });
  } catch (error) {
    console.error("Error getting pusat data stats:", error);
    res.status(500).json({ error: "Gagal mengambil statistik" });
  }
};

// Get single pusat data by ID
export const getById = async (req, res) => {
  try {
    const data = await PusatData.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id_user", "nama_lengkap", "username"],
        },
      ],
    });

    if (!data) {
      return res.status(404).json({ error: "Data tidak ditemukan" });
    }

    res.json({ data });
  } catch (error) {
    console.error("Error getting pusat data by id:", error);
    res.status(500).json({ error: "Gagal mengambil data" });
  }
};

// Create new pusat data
export const create = async (req, res) => {
  try {
    const data = await PusatData.create({
      ...pickPusatDataFields(req.body),
      sumber: req.body.sumber || "BPN",
      status: req.body.status || "Aktif",
      created_by: req.user.id,
      created_at: new Date(),
      updated_at: new Date(),
    });

    res.status(201).json({
      message: "Data berhasil ditambahkan",
      data,
    });
  } catch (error) {
    console.error("Error creating pusat data:", error);
    res.status(500).json({ error: "Gagal menambahkan data" });
  }
};

// Update pusat data
export const update = async (req, res) => {
  try {
    const data = await PusatData.findByPk(req.params.id);

    if (!data) {
      return res.status(404).json({ error: "Data tidak ditemukan" });
    }

    await data.update({
      ...pickPusatDataFields(req.body),
      updated_at: new Date(),
    });

    res.json({
      message: "Data berhasil diperbarui",
      data,
    });
  } catch (error) {
    console.error("Error updating pusat data:", error);
    res.status(500).json({ error: "Gagal memperbarui data" });
  }
};

// Delete pusat data
export const remove = async (req, res) => {
  try {
    const data = await PusatData.findByPk(req.params.id);

    if (!data) {
      return res.status(404).json({ error: "Data tidak ditemukan" });
    }

    await data.destroy();

    res.json({ message: "Data berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting pusat data:", error);
    res.status(500).json({ error: "Gagal menghapus data" });
  }
};

const PusatDataController = {
  getAll,
  getStats,
  getById,
  create,
  update,
  remove,
};
export default PusatDataController;
