import { Op } from "sequelize";
import { SewaAset, Aset, User, PermintaanSewa } from "../models/index.js";
import { autoExpireSewa } from "../services/sewaExpiry.service.js";

// Lightweight middleware: auto-expire sewa whose tanggal_berakhir < today
// before any read operation.
const autoExpireIfActive = async () => {
  try {
    await autoExpireSewa();
  } catch {
    // Silently ignore — expiry is best-effort on read path
  }
};

const PERIODE_BAYAR_OPTIONS = new Set([
  "Bulanan",
  "Triwulan",
  "Semester",
  "Tahunan",
  "Sekali Bayar",
]);

const normalizePeriodeBayar = (periode) =>
  PERIODE_BAYAR_OPTIONS.has(periode) ? periode : "Tahunan";

let sewaDiprosesStatusEnsured = false;

const ensureSewaDiprosesStatus = async () => {
  if (sewaDiprosesStatusEnsured) return;
  await SewaAset.sequelize.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'enum_sewa_aset_status'
      ) THEN
        ALTER TYPE "enum_sewa_aset_status" ADD VALUE IF NOT EXISTS 'Diproses';
      END IF;
    END $$;
  `);
  sewaDiprosesStatusEnsured = true;
};

const RENT_PERIOD_DIVISORS = {
  Bulanan: 12,
  Triwulan: 4,
  Semester: 2,
  Tahunan: 1,
  "Sekali Bayar": 1,
};

const calculateRentPerPeriod = (nilaiAset, periodeBayar) => {
  const baseValue = Number(nilaiAset || 0);
  if (!baseValue) return 0;
  const divisor = RENT_PERIOD_DIVISORS[periodeBayar] || 1;
  return Math.round(baseValue / divisor);
};

const resolveNilaiSewa = async ({ idAset, periodeBayar, fallback }) => {
  if (!idAset) return Number(fallback || 0);

  const aset = await Aset.findByPk(idAset, {
    attributes: ["nilai_aset"],
  });
  if (aset) {
    return calculateRentPerPeriod(aset.nilai_aset, periodeBayar);
  }

  return Number(fallback || 0);
};

const resolvePolygonSewa = async ({ idAset, polygonSewa }) => {
  if (polygonSewa) return polygonSewa;
  if (!idAset) return null;

  const aset = await Aset.findByPk(idAset, {
    attributes: ["polygon_bidang"],
  });
  return aset?.polygon_bidang || null;
};

const ensureMasyarakatPermintaanColumns = async () => {
  await SewaAset.sequelize.query(`
    ALTER TABLE "permintaan_sewa"
      ADD COLUMN IF NOT EXISTS "pemohon_user_id" INTEGER REFERENCES "users" ("id_user"),
      ADD COLUMN IF NOT EXISTS "pemohon_username" VARCHAR(50);
  `);
};

const publicAvailableAttributes = [
  "id_sewa",
  "nama_aset",
  "lokasi_aset",
  "no_lot",
  "foto_sewa",
  "catatan",
  "polygon_sewa",
  "status",
  "tanggal_berakhir",
  "nilai_sewa",
  "periode_bayar",
  "created_at",
];

// ================================
// PUBLIC - Get available assets for rent (no auth)
// ================================
export const getPublicAvailable = async (req, res) => {
  try {
    await autoExpireIfActive();

    const { search = "", kecamatan, jenis_aset } = req.query;

    const where = { status: { [Op.in]: ["Tersedia", "Disewakan"] } };
    const asetWhere = {};

    if (search) {
      where[Op.or] = [
        { nama_aset: { [Op.iLike]: `%${search}%` } },
        { lokasi_aset: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (kecamatan) asetWhere.kecamatan = kecamatan;
    if (jenis_aset) asetWhere.jenis_aset = jenis_aset;

    const hasAsetFilter = Object.keys(asetWhere).length > 0;

    const data = await SewaAset.findAll({
      where,
      include: [
        {
          model: Aset,
          as: "aset",
          where: hasAsetFilter ? asetWhere : undefined,
          required: hasAsetFilter, // LEFT JOIN when no filter, INNER JOIN when filtering by kecamatan/jenis
          attributes: [
            "id_aset",
            "nama_aset",
            "lokasi",
            "luas",
            "jenis_aset",
            "kecamatan",
            "desa_kelurahan",
            "koordinat_lat",
            "koordinat_long",
            "polygon_bidang",
            "foto_aset",
          ],
        },
      ],
      attributes: [
        "id_sewa",
        "nama_aset",
        "lokasi_aset",
        "no_lot",
        "foto_sewa",
        "catatan",
        "polygon_sewa",
        "status",
        "tanggal_berakhir",
        "created_at",
      ],
      order: [["created_at", "DESC"]],
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error("Public available error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ================================
// MASYARAKAT - Get available assets for rent (auth)
// ================================
export const getAvailableForMasyarakat = async (req, res) => {
  try {
    await autoExpireIfActive();

    const { search = "", kecamatan, jenis_aset } = req.query;
    const where = { status: "Tersedia" };
    const asetWhere = {};

    if (search) {
      where[Op.or] = [
        { nama_aset: { [Op.iLike]: `%${search}%` } },
        { lokasi_aset: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (kecamatan) asetWhere.kecamatan = kecamatan;
    if (jenis_aset) asetWhere.jenis_aset = jenis_aset;

    const hasAsetFilter = Object.keys(asetWhere).length > 0;

    const data = await SewaAset.findAll({
      where,
      include: [
        {
          model: Aset,
          as: "aset",
          where: hasAsetFilter ? asetWhere : undefined,
          required: hasAsetFilter,
          attributes: [
            "id_aset",
            "nama_aset",
            "lokasi",
            "luas",
            "jenis_aset",
            "kecamatan",
            "desa_kelurahan",
            "koordinat_lat",
            "koordinat_long",
            "polygon_bidang",
            "foto_aset",
            "nilai_aset",
          ],
        },
      ],
      attributes: publicAvailableAttributes,
      order: [["created_at", "DESC"]],
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error("Masyarakat available sewa error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ================================
// MASYARAKAT - Get approved rentals (auth)
// ================================
export const getApprovedForMasyarakat = async (req, res) => {
  try {
    await autoExpireIfActive();
    await ensureMasyarakatPermintaanColumns();

    const {
      page = 1,
      limit = 12,
      search = "",
      sortBy = "created_at",
      sortOrder = "desc",
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const where = { status: { [Op.in]: ["Disewakan", "Akan Berakhir"] } };

    if (search) {
      where[Op.or] = [
        { nama_aset: { [Op.iLike]: `%${search}%` } },
        { lokasi_aset: { [Op.iLike]: `%${search}%` } },
        { no_lot: { [Op.iLike]: `%${search}%` } },
        { nama_penyewa: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const allowedSortFields = new Set([
      "created_at",
      "tanggal_mulai",
      "tanggal_berakhir",
      "nama_aset",
      "status",
    ]);
    const safeSortBy = allowedSortFields.has(sortBy) ? sortBy : "created_at";
    const safeSortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const { rows: data, count: total } = await SewaAset.findAndCountAll({
      where,
      include: [
        {
          model: Aset,
          as: "aset",
          attributes: [
            "id_aset",
            "kode_aset",
            "nama_aset",
            "lokasi",
            "luas",
            "jenis_aset",
            "nilai_aset",
            "kecamatan",
            "desa_kelurahan",
            "foto_aset",
          ],
        },
        {
          model: PermintaanSewa,
          as: "permintaan",
          required: true,
          where: {
            status: "Disetujui",
            [Op.or]: [
              { pemohon_user_id: req.user.id_user },
              { pemohon_username: req.user.username },
            ],
          },
          attributes: [
            "id_permintaan",
            "status",
            "nama_pemohon",
            "pemohon_username",
            "tujuan_sewa",
            "catatan_admin",
            "dokumen_respon",
            "created_at",
            "updated_at",
          ],
        },
      ],
      attributes: [
        "id_sewa",
        "nama_aset",
        "lokasi_aset",
        "no_lot",
        "foto_sewa",
        "catatan",
        "status",
        "nama_penyewa",
        "instansi_penyewa",
        "tanggal_mulai",
        "tanggal_berakhir",
        "nilai_sewa",
        "periode_bayar",
        "file_kontrak",
        "dokumen_pendukung",
        "created_at",
      ],
      order: [[safeSortBy, safeSortOrder]],
      limit: Number(limit),
      offset,
      distinct: true,
    });

    res.json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Masyarakat approved sewa error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ================================
// GET ALL - Penyewaan list with pagination, search, filters
// ================================
export const getAll = async (req, res) => {
  try {
    await autoExpireIfActive();
    await ensureSewaDiprosesStatus();

    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      sortBy = "created_at",
      sortOrder = "desc",
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const where = {};

    if (search) {
      where[Op.or] = [
        { nama_aset: { [Op.iLike]: `%${search}%` } },
        { no_lot: { [Op.iLike]: `%${search}%` } },
        { nama_penyewa: { [Op.iLike]: `%${search}%` } },
        { nomor_kontrak: { [Op.iLike]: `%${search}%` } },
        { instansi_penyewa: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (status) {
      where.status = status;
    } else {
      where.status = { [Op.in]: ["Tersedia", "Diproses", "Disewakan"] };
    }

    const { rows: data, count: total } = await SewaAset.findAndCountAll({
      where,
      include: [
        {
          model: Aset,
          as: "aset",
          attributes: [
            "id_aset",
            "kode_aset",
            "nama_aset",
            "lokasi",
            "koordinat_lat",
            "koordinat_long",
            "polygon_bidang",
            "atas_nama",
            "luas",
            "nilai_aset",
            "foto_aset",
            "kecamatan",
            "desa_kelurahan",
          ],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id_user", "nama_lengkap", "username"],
        },
        {
          model: PermintaanSewa,
          as: "permintaan",
          required: false,
          where: { status: { [Op.in]: ["Diproses", "Disetujui"] } },
          attributes: [
            "id_permintaan",
            "status",
            "nama_pemohon",
            "pemohon_username",
            "tujuan_sewa",
            "catatan_admin",
            "dokumen_respon",
            "created_at",
            "updated_at",
          ],
        },
      ],
      order: [[sortBy, sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC"]],
      limit: Number(limit),
      offset,
      distinct: true,
    });

    res.json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("SewaAset getAll error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ================================
// GET BY ID
// ================================
export const getById = async (req, res) => {
  try {
    await autoExpireIfActive();
    const sewa = await SewaAset.findByPk(req.params.id, {
      include: [
        {
          model: Aset,
          as: "aset",
          attributes: [
            "id_aset",
            "kode_aset",
            "nama_aset",
            "lokasi",
            "koordinat_lat",
            "koordinat_long",
            "polygon_bidang",
            "atas_nama",
            "luas",
            "nilai_aset",
            "foto_aset",
            "kecamatan",
            "desa_kelurahan",
          ],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id_user", "nama_lengkap", "username"],
        },
      ],
    });

    if (!sewa) {
      return res.status(404).json({ error: "Data sewa tidak ditemukan" });
    }

    res.json({ success: true, data: sewa });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================================
// GET STATS
// ================================
export const getStats = async (req, res) => {
  try {
    await autoExpireIfActive();
    await ensureSewaDiprosesStatus();

    const [
      total,
      tersedia,
      diproses,
      disewakan,
      akanBerakhir,
      berakhir,
      dikembalikan,
      activeSewas,
    ] = await Promise.all([
      SewaAset.count(),
      SewaAset.count({ where: { status: "Tersedia" } }),
      SewaAset.count({ where: { status: "Diproses" } }),
      SewaAset.count({ where: { status: "Disewakan" } }),
      SewaAset.count({ where: { status: "Akan Berakhir" } }),
      SewaAset.count({ where: { status: "Berakhir" } }),
      SewaAset.count({ where: { status: "Dikembalikan" } }),
      SewaAset.findAll({
        where: { status: { [Op.in]: ["Disewakan", "Akan Berakhir"] } },
        attributes: ["nilai_sewa", "periode_bayar"],
        include: [
          {
            model: Aset,
            as: "aset",
            attributes: ["nilai_aset"],
          },
        ],
      }),
    ]);

    const summary = activeSewas.reduce(
      (acc, item) => {
        const nilaiSewa = Number(item.nilai_sewa || 0);
        const nilaiAset = Number(item.aset?.nilai_aset || 0);
        acc.totalNilaiSewa += nilaiSewa;
        acc.totalNilaiAsetTersewa += nilaiAset;
        if (item.periode_bayar === "Triwulan") {
          acc.totalNilaiSewaTriwulan += nilaiSewa;
        }
        if (item.periode_bayar === "Semester") {
          acc.totalNilaiSewaSemester += nilaiSewa;
        }
        return acc;
      },
      {
        totalNilaiSewa: 0,
        totalNilaiAsetTersewa: 0,
        totalNilaiSewaTriwulan: 0,
        totalNilaiSewaSemester: 0,
      },
    );

    res.json({
      success: true,
      data: {
        total,
        tersedia,
        diproses,
        disewakan,
        akanBerakhir,
        berakhir,
        dikembalikan,
        ...summary,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================================
// GET PENGEMBALIAN - Only returned/ended rentals
// ================================
export const getPengembalian = async (req, res) => {
  try {
    await autoExpireIfActive();

    const {
      page = 1,
      limit = 10,
      search = "",
      kondisi,
      sortBy = "tanggal_pengembalian",
      sortOrder = "desc",
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const where = {
      status: { [Op.in]: ["Dikembalikan", "Berakhir"] },
    };

    if (search) {
      where[Op.or] = [
        { nama_penyewa: { [Op.iLike]: `%${search}%` } },
        { nama_aset: { [Op.iLike]: `%${search}%` } },
        { nomor_kontrak: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (kondisi) {
      where.kondisi_pengembalian = kondisi;
    }

    const { rows: data, count: total } = await SewaAset.findAndCountAll({
      where,
      include: [
        {
          model: Aset,
          as: "aset",
          attributes: [
            "id_aset",
            "kode_aset",
            "nama_aset",
            "lokasi",
            "koordinat_lat",
            "koordinat_long",
            "polygon_bidang",
            "atas_nama",
            "luas",
            "nilai_aset",
            "foto_aset",
            "kecamatan",
            "desa_kelurahan",
          ],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id_user", "nama_lengkap", "username"],
        },
      ],
      order: [[sortBy, sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC"]],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================================
// CREATE - Sediakan aset untuk disewa (status: Tersedia)
// ================================
export const create = async (req, res) => {
  try {
    const {
      id_aset,
      nama_aset,
      lokasi_aset,
      dokumen_pendukung,
      catatan,
      no_lot,
      tanggal_mulai,
      tanggal_berakhir,
      nilai_sewa,
      periode_bayar,
      foto_sewa,
      polygon_sewa,
    } = req.body;

    if (!nama_aset) {
      return res.status(400).json({
        error: "Pilih aset yang akan disediakan untuk disewa",
      });
    }
    const normalizedPeriodeBayar = normalizePeriodeBayar(periode_bayar);
    const resolvedNilaiSewa = await resolveNilaiSewa({
      idAset: id_aset,
      periodeBayar: normalizedPeriodeBayar,
      fallback: nilai_sewa,
    });
    const resolvedPolygonSewa = await resolvePolygonSewa({
      idAset: id_aset,
      polygonSewa: polygon_sewa,
    });

    const newSewa = await SewaAset.create({
      id_aset,
      nama_aset,
      lokasi_aset,
      dokumen_pendukung: dokumen_pendukung || null,
      status: "Tersedia",
      tanggal_mulai,
      tanggal_berakhir,
      nilai_sewa: resolvedNilaiSewa,
      periode_bayar: normalizedPeriodeBayar,
      catatan,
      no_lot,
      foto_sewa: foto_sewa || null,
      polygon_sewa: resolvedPolygonSewa,
      created_by: req.user.id_user,
    });

    res.status(201).json({ success: true, data: newSewa });
  } catch (error) {
    console.error("SewaAset create error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ================================
// UPDATE - Edit rental
// ================================
export const update = async (req, res) => {
  try {
    const sewa = await SewaAset.findByPk(req.params.id);
    if (!sewa) {
      return res.status(404).json({ error: "Data sewa tidak ditemukan" });
    }

    const {
      id_aset,
      nama_aset,
      lokasi_aset,
      nama_penyewa,
      nik_penyewa,
      instansi_penyewa,
      alamat_penyewa,
      telepon_penyewa,
      email_penyewa,
      tanggal_mulai,
      tanggal_berakhir,
      nilai_sewa,
      periode_bayar,
      nomor_kontrak,
      file_kontrak,
      dokumen_pendukung,
      status,
      catatan,
      no_lot,
      foto_sewa,
      polygon_sewa,
    } = req.body;
    const normalizedPeriodeBayar = normalizePeriodeBayar(
      periode_bayar || sewa.periode_bayar,
    );
    if (status === "Diproses") {
      await ensureSewaDiprosesStatus();
    }
    const resolvedNilaiSewa = await resolveNilaiSewa({
      idAset: id_aset || sewa.id_aset,
      periodeBayar: normalizedPeriodeBayar,
      fallback: nilai_sewa,
    });

    await sewa.update({
      id_aset,
      nama_aset,
      lokasi_aset,
      nama_penyewa,
      nik_penyewa,
      instansi_penyewa,
      alamat_penyewa,
      telepon_penyewa,
      email_penyewa,
      tanggal_mulai,
      tanggal_berakhir,
      nilai_sewa: resolvedNilaiSewa,
      periode_bayar: normalizedPeriodeBayar,
      nomor_kontrak,
      file_kontrak,
      dokumen_pendukung,
      status,
      catatan,
      no_lot,
      foto_sewa,
      polygon_sewa,
    });

    res.json({ success: true, data: sewa });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================================
// PROSES PENGEMBALIAN - Return asset
// ================================
export const prosesPengembalian = async (req, res) => {
  try {
    const sewa = await SewaAset.findByPk(req.params.id);
    if (!sewa) {
      return res.status(404).json({ error: "Data sewa tidak ditemukan" });
    }

    if (sewa.status === "Dikembalikan") {
      return res
        .status(400)
        .json({ error: "Aset sudah dikembalikan sebelumnya" });
    }

    const {
      tanggal_pengembalian,
      kondisi_pengembalian,
      catatan_pengembalian,
      foto_kondisi,
    } = req.body;

    if (!tanggal_pengembalian || !kondisi_pengembalian) {
      return res.status(400).json({
        error: "Tanggal pengembalian dan kondisi pengembalian wajib diisi",
      });
    }

    await sewa.update({
      status: "Dikembalikan",
      tanggal_pengembalian,
      kondisi_pengembalian,
      catatan_pengembalian,
      foto_kondisi: foto_kondisi || null,
    });

    res.json({ success: true, data: sewa });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================================
// DELETE
// ================================
export const remove = async (req, res) => {
  try {
    const sewa = await SewaAset.findByPk(req.params.id);
    if (!sewa) {
      return res.status(404).json({ error: "Data sewa tidak ditemukan" });
    }

    await sewa.destroy();

    res.json({ success: true, message: "Data sewa berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
