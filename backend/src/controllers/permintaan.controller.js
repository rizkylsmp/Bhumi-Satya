import { Op } from "sequelize";
import { PermintaanSewa, SewaAset, User } from "../models/index.js";

const PERIODE_BAYAR_OPTIONS = new Set([
  "Bulanan",
  "Triwulan",
  "Semester",
  "Tahunan",
  "Sekali Bayar",
]);

const normalizePeriodeBayar = (periode) =>
  PERIODE_BAYAR_OPTIONS.has(periode) ? periode : "Tahunan";

const STATUS_OPTIONS = new Set(["Baru", "Diproses", "Disetujui", "Ditolak"]);
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

const buildSewaStatusUpdate = (status, permintaan, body = {}) => {
  if (status === "Diproses") {
    return {
      status: "Diproses",
      nama_penyewa: permintaan.nama_pemohon || null,
      nik_penyewa: permintaan.nik || null,
      telepon_penyewa: permintaan.no_telepon || null,
      email_penyewa: permintaan.email || null,
      alamat_penyewa: permintaan.alamat || null,
    };
  }

  if (status === "Disetujui") {
    const sewaUpdate = {
      status: "Disewakan",
      nama_penyewa: permintaan.nama_pemohon || null,
      nik_penyewa: permintaan.nik || null,
      telepon_penyewa: permintaan.no_telepon || null,
      email_penyewa: permintaan.email || null,
      alamat_penyewa: permintaan.alamat || null,
    };
    if (body.tanggal_mulai) sewaUpdate.tanggal_mulai = body.tanggal_mulai;
    if (body.tanggal_berakhir)
      sewaUpdate.tanggal_berakhir = body.tanggal_berakhir;
    if (body.nilai_sewa !== undefined) sewaUpdate.nilai_sewa = body.nilai_sewa;
    if (body.periode_bayar !== undefined) {
      sewaUpdate.periode_bayar = normalizePeriodeBayar(body.periode_bayar);
    }
    return sewaUpdate;
  }

  if (status === "Ditolak") {
    return {
      status: "Tersedia",
      nama_penyewa: null,
      nik_penyewa: null,
      telepon_penyewa: null,
      email_penyewa: null,
      alamat_penyewa: null,
      tanggal_mulai: null,
      tanggal_berakhir: null,
    };
  }

  if (status === "Baru") {
    return { status: "Tersedia" };
  }

  return null;
};

const syncSewaWithPermintaanStatus = async (permintaan, body = {}) => {
  if (!permintaan?.id_sewa || !permintaan?.status) return null;

  await ensureSewaDiprosesStatus();
  const sewa = await SewaAset.findByPk(permintaan.id_sewa);
  if (!sewa) return null;

  const sewaUpdate = buildSewaStatusUpdate(
    permintaan.status,
    permintaan,
    body,
  );
  if (!sewaUpdate) return sewa;

  await sewa.update(sewaUpdate);
  return sewa;
};

const ensureMasyarakatColumns = async () => {
  await PermintaanSewa.sequelize.query(`
    ALTER TABLE "permintaan_sewa"
      ADD COLUMN IF NOT EXISTS "pemohon_user_id" INTEGER REFERENCES "users" ("id_user"),
      ADD COLUMN IF NOT EXISTS "pemohon_username" VARCHAR(50);
  `);
};

const pickPermintaanUpdate = (body) => {
  const fields = [
    "id_sewa",
    "nama_aset",
    "nama_pemohon",
    "nik",
    "no_telepon",
    "email",
    "alamat",
    "tujuan_sewa",
    "status",
    "catatan_admin",
    "dokumen_respon",
  ];

  return fields.reduce((acc, field) => {
    if (body[field] !== undefined) acc[field] = body[field];
    return acc;
  }, {});
};

// ================================
// PUBLIC - Submit a rental request (no auth)
// ================================
export const submitRequest = async (req, res) => {
  try {
    await ensureMasyarakatColumns();

    const {
      id_sewa,
      nama_aset,
      nama_pemohon,
      nik,
      no_telepon,
      email,
      alamat,
      tujuan_sewa,
    } = req.body;

    if (!nama_aset || !nama_pemohon || !no_telepon || !tujuan_sewa) {
      return res.status(400).json({
        error:
          "Nama aset, nama pemohon, nomor telepon, dan tujuan sewa wajib diisi",
      });
    }

    const permintaan = await PermintaanSewa.create({
      id_sewa: id_sewa || null,
      nama_aset,
      nama_pemohon,
      nik: nik || null,
      no_telepon,
      email: email || null,
      alamat: alamat || null,
      pemohon_user_id: req.user?.id_user || null,
      pemohon_username: req.user?.username || null,
      tujuan_sewa,
    });

    res.status(201).json({ success: true, data: permintaan });
  } catch (error) {
    console.error("Submit request error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ================================
// MASYARAKAT - Submit request using logged-in account
// ================================
export const submitForMasyarakat = async (req, res) => {
  const user = await User.findByPk(req.user.id_user);
  if (!user) {
    return res.status(404).json({ error: "Akun masyarakat tidak ditemukan" });
  }

  req.body = {
    ...req.body,
    nama_pemohon: user.nama_lengkap || user.username,
    nik: user.nik || null,
    no_telepon: user.no_telepon,
    email: user.email,
    alamat: user.alamat || null,
  };
  return submitRequest(req, res);
};

// ================================
// MASYARAKAT - List own requests
// ================================
export const getForMasyarakat = async (req, res) => {
  try {
    await ensureMasyarakatColumns();

    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      sortBy = "created_at",
      sortOrder = "desc",
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const where = {
      [Op.and]: [
        {
          [Op.or]: [
            { pemohon_user_id: req.user.id_user },
            { pemohon_username: req.user.username },
          ],
        },
      ],
    };

    if (search) {
      where[Op.and].push({
        [Op.or]: [
          { nama_aset: { [Op.iLike]: `%${search}%` } },
          { no_telepon: { [Op.iLike]: `%${search}%` } },
          { tujuan_sewa: { [Op.iLike]: `%${search}%` } },
        ],
      });
    }

    if (status) where.status = status;

    const allowedSortFields = new Set(["created_at", "updated_at", "status", "nama_aset"]);
    const safeSortBy = allowedSortFields.has(sortBy) ? sortBy : "created_at";
    const safeSortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const { rows: data, count: total } = await PermintaanSewa.findAndCountAll({
      where,
      include: [
        {
          model: SewaAset,
          as: "sewa",
          attributes: ["id_sewa", "nama_aset", "no_lot", "status", "foto_sewa"],
        },
      ],
      order: [[safeSortBy, safeSortOrder]],
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
    console.error("Masyarakat permintaan error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ================================
// GET ALL - List permintaan with pagination (authenticated)
// ================================
export const getAll = async (req, res) => {
  try {
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
        { nama_pemohon: { [Op.iLike]: `%${search}%` } },
        { no_telepon: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (status) where.status = status;

    const { rows: data, count: total } = await PermintaanSewa.findAndCountAll({
      where,
      include: [
        {
          model: SewaAset,
          as: "sewa",
          attributes: ["id_sewa", "nama_aset", "no_lot", "status"],
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
    console.error("Permintaan getAll error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ================================
// UPDATE STATUS (authenticated)
// ================================
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      catatan_admin,
      dokumen_respon,
      tanggal_mulai,
      tanggal_berakhir,
      nilai_sewa,
      periode_bayar,
    } = req.body;

    const permintaan = await PermintaanSewa.findByPk(id);
    if (!permintaan) {
      return res.status(404).json({ error: "Permintaan tidak ditemukan" });
    }

    if (!STATUS_OPTIONS.has(status)) {
      return res.status(400).json({ error: "Status permintaan tidak valid" });
    }

    // Validation: approval requires dokumen & periode sewa
    if (status === "Disetujui") {
      if (!dokumen_respon || dokumen_respon.length === 0) {
        return res
          .status(400)
          .json({
            error: "Dokumen lampiran wajib diisi untuk menyetujui permintaan",
          });
      }
      if (!tanggal_mulai || !tanggal_berakhir) {
        return res
          .status(400)
          .json({
            error:
              "Tanggal mulai dan berakhir sewa wajib diisi untuk menyetujui permintaan",
          });
      }
    }

    const updateData = { status };
    if (catatan_admin !== undefined) updateData.catatan_admin = catatan_admin;
    if (dokumen_respon !== undefined)
      updateData.dokumen_respon = dokumen_respon;

    await permintaan.update(updateData);

    // When approved, update linked SewaAset → "Disewakan" + transfer data
    if (status === "Disetujui" && permintaan.id_sewa) {
      const sewa = await SewaAset.findByPk(permintaan.id_sewa);
      if (sewa) {
        const sewaUpdate = { status: "Disewakan" };
        // Set rental period
        if (tanggal_mulai) sewaUpdate.tanggal_mulai = tanggal_mulai;
        if (tanggal_berakhir) sewaUpdate.tanggal_berakhir = tanggal_berakhir;
        if (nilai_sewa !== undefined) sewaUpdate.nilai_sewa = nilai_sewa;
        if (periode_bayar !== undefined) {
          sewaUpdate.periode_bayar = normalizePeriodeBayar(periode_bayar);
        }
        // Transfer pemohon data to penyewa fields if not already filled
        if (!sewa.nama_penyewa && permintaan.nama_pemohon)
          sewaUpdate.nama_penyewa = permintaan.nama_pemohon;
        if (!sewa.nik_penyewa && permintaan.nik)
          sewaUpdate.nik_penyewa = permintaan.nik;
        if (!sewa.telepon_penyewa && permintaan.no_telepon)
          sewaUpdate.telepon_penyewa = permintaan.no_telepon;
        if (!sewa.email_penyewa && permintaan.email)
          sewaUpdate.email_penyewa = permintaan.email;
        if (!sewa.alamat_penyewa && permintaan.alamat)
          sewaUpdate.alamat_penyewa = permintaan.alamat;
        await sewa.update(sewaUpdate);
      }
    }

    if (permintaan.id_sewa) {
      await ensureSewaDiprosesStatus();
      const sewa = await SewaAset.findByPk(permintaan.id_sewa);
      if (sewa) {
        const sewaUpdate = buildSewaStatusUpdate(status, permintaan, {
          tanggal_mulai,
          tanggal_berakhir,
          nilai_sewa,
          periode_bayar,
        });
        if (sewaUpdate) await sewa.update(sewaUpdate);
      }
    }

    const syncedPermintaan = await PermintaanSewa.findByPk(id, {
      include: [
        {
          model: SewaAset,
          as: "sewa",
          attributes: ["id_sewa", "nama_aset", "no_lot", "status"],
        },
      ],
    });

    res.json({ success: true, data: syncedPermintaan || permintaan });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ================================
// UPDATE - Edit permintaan data (authenticated)
// ================================
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const permintaan = await PermintaanSewa.findByPk(id);

    if (!permintaan) {
      return res.status(404).json({ error: "Permintaan tidak ditemukan" });
    }

    const updateData = pickPermintaanUpdate(req.body);

    if (updateData.status && !STATUS_OPTIONS.has(updateData.status)) {
      return res.status(400).json({ error: "Status permintaan tidak valid" });
    }

    if (updateData.nama_aset !== undefined && !updateData.nama_aset) {
      return res.status(400).json({ error: "Nama aset wajib diisi" });
    }

    if (updateData.nama_pemohon !== undefined && !updateData.nama_pemohon) {
      return res.status(400).json({ error: "Nama pemohon wajib diisi" });
    }

    if (updateData.no_telepon !== undefined && !updateData.no_telepon) {
      return res.status(400).json({ error: "Nomor telepon wajib diisi" });
    }

    if (updateData.tujuan_sewa !== undefined && !updateData.tujuan_sewa) {
      return res.status(400).json({ error: "Tujuan sewa wajib diisi" });
    }

    await permintaan.update(updateData);

    if (updateData.status) {
      await syncSewaWithPermintaanStatus(permintaan, req.body);
    }

    const syncedPermintaan = await PermintaanSewa.findByPk(id, {
      include: [
        {
          model: SewaAset,
          as: "sewa",
          attributes: ["id_sewa", "nama_aset", "no_lot", "status"],
        },
      ],
    });

    res.json({ success: true, data: syncedPermintaan || permintaan });
  } catch (error) {
    console.error("Update permintaan error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ================================
// DELETE (authenticated)
// ================================
export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const permintaan = await PermintaanSewa.findByPk(id);
    if (!permintaan) {
      return res.status(404).json({ error: "Permintaan tidak ditemukan" });
    }
    await permintaan.destroy();
    res.json({ success: true, message: "Permintaan berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
