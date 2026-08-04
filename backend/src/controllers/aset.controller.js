import { Op, Sequelize } from "sequelize";
import { Aset, Aset2dCatalog, User, SewaAset, sequelize } from "../models/index.js";
import AuditService from "../services/audit.service.js";
import NotificationService from "../services/notification.service.js";
import {
  Asset3dValidationError,
  normalizeAsset3dFields,
} from "../utils/asset3d.js";
import { getCentroidFromPolygonField } from "../utils/polygonCentroid.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isTransientDbConnectionError = (error) => {
  const code = error?.parent?.code || error?.original?.code || error?.code;
  return (
    code === "53300" ||
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    error?.name === "SequelizeConnectionAcquireTimeoutError" ||
    /too many connections|timeout|connection terminated/i.test(
      error?.message || "",
    )
  );
};

const withDbRetry = async (operation, retries = 2) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransientDbConnectionError(error) || attempt === retries) {
        throw error;
      }
      await sleep(250 * (attempt + 1));
    }
  }
  throw lastError;
};

const normalizeSumber = (value) => {
  const normalized = String(value || "").toUpperCase().trim();
  return ["BPN", "BPKA"].includes(normalized) ? normalized : null;
};

const appendExplicitSourceFilters = (where, query = {}) => {
  const sumber = normalizeSumber(query.sumber || query.instansi);
  if (sumber) where.sumber = sumber;
  if (query.reconciliation_status) {
    where.reconciliation_status = query.reconciliation_status;
  }
  return where;
};

const ACTIVE_SEWA_STATUSES = ["Disewakan", "Akan Berakhir", "Aktif"];

const isActiveSewaStatus = (status) => ACTIVE_SEWA_STATUSES.includes(status);

const buildActiveSewaExistsCondition = (negated = false) => {
  const statuses = ACTIVE_SEWA_STATUSES.map((status) =>
    Aset.sequelize.escape(status),
  ).join(", ");

  return Sequelize.literal(`
    ${negated ? "NOT " : ""}EXISTS (
      SELECT 1
      FROM sewa_aset active_sewa
      WHERE active_sewa.id_aset = "Aset"."id_aset"
        AND active_sewa.status::text IN (${statuses})
    )
  `);
};

const buildCertifiedCondition = (certified = true) => {
  const status = `LOWER(COALESCE("Aset"."status_sertifikat", ''))`;
  const certificateNumber = `COALESCE("Aset"."nomor_sertifikat", '')`;
  const statusSaysNotCertified = `(${status} LIKE '%belum%' OR ${status} LIKE '%tidak%')`;
  const statusSaysCertified = `(
    ${status} NOT LIKE '%belum%'
    AND ${status} NOT LIKE '%tidak%'
    AND (
      ${status} LIKE '%telah%'
      OR ${status} LIKE '%sudah%'
      OR ${status} LIKE '%bersertifikat%'
    )
  )`;
  const numberLooksCertified = `CHAR_LENGTH(TRIM(${certificateNumber})) > 10`;

  if (certified) {
    return Sequelize.literal(`(
      ${statusSaysCertified}
      OR (
        NOT ${statusSaysNotCertified}
        AND ${numberLooksCertified}
      )
    )`);
  }

  return Sequelize.literal(`(
    ${statusSaysNotCertified}
    OR (
      ${status} = ''
      AND CHAR_LENGTH(TRIM(${certificateNumber})) <= 10
    )
  )`);
};

/**
 * Get all assets with pagination
 * GET /api/aset
 */
export const getAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      jenis_aset,
      tahun,
      kecamatan,
      desa_kelurahan,
      has_location,
      has_nibar,
      jenis_hak,
      opd_pengguna,
      sumber,
      instansi,
      reconciliation_status,
      sort = "created_at",
      order = "DESC",
      status_sewa,
      is_certified,
    } = req.query;

    // Build where clause
    const where = {};
    appendExplicitSourceFilters(where, {
      sumber,
      instansi,
      reconciliation_status,
    });

    if (search) {
      where[Op.or] = [
        { nama_aset: { [Op.iLike]: `%${search}%` } },
        { kode_aset: { [Op.iLike]: `%${search}%` } },
        { lokasi: { [Op.iLike]: `%${search}%` } },
        { nib: { [Op.iLike]: `%${search}%` } },
        { nibar: { [Op.iLike]: `%${search}%` } },
        { id_pemda: { [Op.iLike]: `%${search}%` } },
        { kode_barang: { [Op.iLike]: `%${search}%` } },
        { no_register: { [Op.iLike]: `%${search}%` } },
        { penggunaan_kib: { [Op.iLike]: `%${search}%` } },
        { nop: { [Op.iLike]: `%${search}%` } },
        { nama_wajib_pajak: { [Op.iLike]: `%${search}%` } },
        { pajak_status: { [Op.iLike]: `%${search}%` } },
        Sequelize.where(Sequelize.cast(Sequelize.col("pajak_fid"), "text"), {
          [Op.iLike]: `%${search}%`,
        }),
        { nomor_hak: { [Op.iLike]: `%${search}%` } },
        { nomor_sertifikat: { [Op.iLike]: `%${search}%` } },
        { kecamatan: { [Op.iLike]: `%${search}%` } },
        { desa_kelurahan: { [Op.iLike]: `%${search}%` } },
        { opd_pengguna: { [Op.iLike]: `%${search}%` } },
        Sequelize.literal(`EXISTS (
          SELECT 1 FROM "aset_2d_catalog" parcel_search
          WHERE parcel_search."id_aset" = "Aset"."id_aset"
            AND parcel_search."kode_2d" ILIKE ${Sequelize.escape(`%${search}%`)}
        )`),
      ];
    }

    if (status) where.status = status;
    if (jenis_aset) where.jenis_aset = jenis_aset;
    if (tahun) where.tahun_perolehan = tahun;
    if (kecamatan) where.kecamatan = kecamatan;
    if (desa_kelurahan) where.desa_kelurahan = desa_kelurahan;
    if (jenis_hak) where.jenis_hak = jenis_hak;
    if (opd_pengguna) where.opd_pengguna = { [Op.iLike]: `%${opd_pengguna}%` };

    if (is_certified === "true") {
      where[Op.and] = [...(where[Op.and] || []), buildCertifiedCondition(true)];
    } else if (is_certified === "false") {
      where[Op.and] = [
        ...(where[Op.and] || []),
        buildCertifiedCondition(false),
      ];
    }

    // Location filter
    if (has_location === "true") {
      where.koordinat_lat = { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: 0 }] };
      where.koordinat_long = { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: 0 }] };
    } else if (has_location === "false") {
      where[Op.and] = [
        ...(where[Op.and] || []),
        Sequelize.literal(
          "(koordinat_lat IS NULL OR CAST(koordinat_lat AS FLOAT) = 0)",
        ),
      ];
    }

    // NIBAR filter
    if (has_nibar === "true") {
      where.nibar = { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: "" }] };
    } else if (has_nibar === "false") {
      where.nibar = { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: "" }] };
    }

    if (status_sewa === "tersewa" || status_sewa === "tidak") {
      where[Op.and] = [
        ...(where[Op.and] || []),
        buildActiveSewaExistsCondition(status_sewa === "tidak"),
      ];
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get assets with pagination
    const { count, rows: assets } = await withDbRetry(() =>
      Aset.findAndCountAll({
        where,
        distinct: true,
        limit: parseInt(limit),
        offset,
        order: [[sort, order.toUpperCase()]],
        include: [
          {
            model: User,
            as: "creator",
            attributes: ["id_user", "nama_lengkap", "username"],
          },
          {
            model: SewaAset,
            as: "sewas",
            attributes: [
              "id_sewa",
              "status",
              "nama_penyewa",
              "tanggal_berakhir",
            ],
            required: false,
          },
          {
            model: Aset2dCatalog,
            as: "catalog2d",
            attributes: ["kode_2d", "status"],
            required: false,
          },
        ],
      }),
    );

    // Compute status_sewa for each asset
    const assetsWithSewa = assets.map((a) => {
      const plain = a.toJSON();
      const activeSewa = plain.sewas?.find((s) => isActiveSewaStatus(s.status));
      plain.status_sewa = activeSewa ? "Tersewa" : "Tidak Tersewa";
      if (activeSewa) {
        plain.penyewa_aktif = activeSewa.nama_penyewa;
        plain.sewa_berakhir = activeSewa.tanggal_berakhir;
      }
      delete plain.sewas;
      plain.kode_2d = plain.catalog2d?.kode_2d || null;
      delete plain.catalog2d;
      return plain;
    });

    // Filter by status_sewa if requested
    let finalData = assetsWithSewa;
    if (status_sewa === "tersewa") {
      finalData = assetsWithSewa.filter((a) => a.status_sewa === "Tersewa");
    } else if (status_sewa === "tidak") {
      finalData = assetsWithSewa.filter(
        (a) => a.status_sewa === "Tidak Tersewa",
      );
    }

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      success: true,
      data: finalData,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching assets:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get distinct filter options from actual data
 * GET /api/aset/filter-options
 */
export const getFilterOptions = async (req, res) => {
  try {
    const sourceWhere = {};
    appendExplicitSourceFilters(sourceWhere, req.query);

    const kelurahanRows = await Aset.findAll({
      attributes: [
        [
          Sequelize.fn("DISTINCT", Sequelize.col("desa_kelurahan")),
          "desa_kelurahan",
        ],
      ],
      where: {
        ...sourceWhere,
        desa_kelurahan: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: "" }] },
      },
      order: [[Sequelize.col("desa_kelurahan"), "ASC"]],
      raw: true,
    });

    const kecamatanRows = await Aset.findAll({
      attributes: [
        [Sequelize.fn("DISTINCT", Sequelize.col("kecamatan")), "kecamatan"],
      ],
      where: {
        ...sourceWhere,
        kecamatan: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: "" }] },
      },
      order: [[Sequelize.col("kecamatan"), "ASC"]],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        kelurahan: kelurahanRows.map((r) => r.desa_kelurahan),
        kecamatan: kecamatanRows.map((r) => r.kecamatan),
      },
    });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get asset statistics
 * GET /api/aset/stats
 */
export const getStats = async (req, res) => {
  try {
    const fn = Aset.sequelize.fn;
    const col = Aset.sequelize.col;
    const literal = Aset.sequelize.literal;

    const baseWhere = {};
    appendExplicitSourceFilters(baseWhere, req.query);

    const groupCount = (field) =>
      Aset.findAll({
        attributes: [field, [fn("COUNT", col(field)), "count"]],
        where: { ...baseWhere, [field]: { [Op.not]: null } },
        group: [field],
        raw: true,
      }).then((rows) =>
        rows.reduce((acc, r) => {
          if (r[field] && r[field] !== "") acc[r[field]] = parseInt(r.count);
          return acc;
        }, {}),
      );

    const countWhere = (extraWhere = {}) =>
      Aset.count({
        where: {
          ...baseWhere,
          ...extraWhere,
        },
      });

    const nonEmptyField = (field) => ({
      [field]: {
        [Op.and]: [{ [Op.not]: null }, { [Op.ne]: "" }],
      },
    });

    const hasLocationCondition = {
      [Op.and]: [
        Sequelize.literal(
          "lokasi IS NOT NULL AND trim(CAST(lokasi AS TEXT)) <> ''",
        ),
      ],
    };

    const hasCoordinateCondition = {
      [Op.and]: [
        Sequelize.literal(
          "koordinat_lat IS NOT NULL AND koordinat_long IS NOT NULL",
        ),
        Sequelize.literal(
          "CAST(koordinat_lat AS FLOAT) <> 0 AND CAST(koordinat_long AS FLOAT) <> 0",
        ),
      ],
    };

    const hasPolygonCondition = {
      [Op.and]: [
        Sequelize.literal(
          "polygon_bidang IS NOT NULL AND polygon_bidang::text NOT IN ('null', '\"\"', '[]', '{}')",
        ),
      ],
    };

    const hasKibCondition = {
      [Op.or]: [
        nonEmptyField("nibar"),
        nonEmptyField("id_pemda"),
        nonEmptyField("kode_barang"),
        nonEmptyField("no_register"),
      ],
    };

    const hasPajakCondition = {
      [Op.or]: [
        { pajak_fid: { [Op.not]: null } },
        nonEmptyField("nop"),
        nonEmptyField("nama_wajib_pajak"),
        nonEmptyField("pajak_status"),
      ],
    };

    const [
      totalAset,
      totalLuas,
      totalNilai,
      totalNilaiBuku,
      totalNilaiNjop,
      totalSertifikat,
      totalLokasi,
      totalLahanKosong,
      totalDigunakan,
      totalKoordinat,
      totalPolygon,
      totalOpdPengguna,
      totalKib,
      totalLuasKib,
      totalHargaPerolehanKib,
      totalKibTerplotting,
      totalPajak,
      totalPajakTerverifikasi,
      totalNjopBumiPajak,
      totalNjopBangunanPajak,
      totalPbbPemetaan,
      byStatus,
      byJenis,
      byJenisHak,
      byStatusHukum,
      byKecamatan,
      byJenisMasalah,
      byOpdPengguna,
      byPlottingStatus,
      bySumber,
      byReconciliationStatus,
    ] = await withDbRetry(() =>
      Promise.all([
        Aset.count({ where: baseWhere }),
        Aset.sum("luas", { where: baseWhere }).then((v) =>
          parseFloat(v || 0),
        ),
        Aset.sum("nilai_aset", { where: baseWhere }).then((v) =>
          parseFloat(v || 0),
        ),
        Aset.sum("nilai_buku", { where: baseWhere }).then((v) =>
          parseFloat(v || 0),
        ),
        Aset.sum("nilai_njop", { where: baseWhere }).then((v) =>
          parseFloat(v || 0),
        ),
        Aset.count({
          where: {
            ...baseWhere,
            nomor_sertifikat: { [Op.ne]: null },
            [Op.and]: [
              Aset.sequelize.where(
                Aset.sequelize.fn(
                  "char_length",
                  Aset.sequelize.col("nomor_sertifikat"),
                ),
                ">",
                10,
              ),
            ],
          },
        }),
        countWhere(hasLocationCondition),
        countWhere({
          penggunaan_saat_ini: { [Op.iLike]: "Lahan Kosong" },
        }),
        countWhere({
          [Op.and]: [
            Sequelize.literal(
              "penggunaan_saat_ini IS NOT NULL AND trim(CAST(penggunaan_saat_ini AS TEXT)) <> ''",
            ),
            Sequelize.literal(
              "lower(trim(CAST(penggunaan_saat_ini AS TEXT))) <> 'lahan kosong'",
            ),
          ],
        }),
        countWhere(hasCoordinateCondition),
        countWhere(hasPolygonCondition),
        countWhere(nonEmptyField("opd_pengguna")),
        countWhere(hasKibCondition),
        Aset.sum("luas_kib", { where: baseWhere }).then((v) =>
          parseFloat(v || 0),
        ),
        Aset.sum("harga_perolehan", { where: baseWhere }).then((v) =>
          parseFloat(v || 0),
        ),
        countWhere(nonEmptyField("plotting_status")),
        countWhere(hasPajakCondition),
        countWhere({
          pajak_status: { [Op.iLike]: "terverifikasi" },
        }),
        Aset.sum("njop_bumi_pemetaan", { where: baseWhere }).then((v) =>
          parseFloat(v || 0),
        ),
        Aset.sum("njop_bangunan_pemetaan", { where: baseWhere }).then((v) =>
          parseFloat(v || 0),
        ),
        Aset.sum("pbb_pemetaan", { where: baseWhere }).then((v) =>
          parseFloat(v || 0),
        ),
        Aset.findAll({
          attributes: ["status", [fn("COUNT", col("status")), "count"]],
          where: baseWhere,
          group: ["status"],
          raw: true,
        }).then((rows) =>
          rows.reduce((acc, r) => {
            acc[r.status] = parseInt(r.count);
            return acc;
          }, {}),
        ),
        groupCount("jenis_aset"),
        groupCount("jenis_hak"),
        groupCount("status_hukum"),
        groupCount("kecamatan"),
        groupCount("jenis_masalah"),
        groupCount("opd_pengguna"),
        groupCount("plotting_status"),
        groupCount("sumber"),
        groupCount("reconciliation_status"),
      ]),
    );

    res.json({
      success: true,
      data: {
        totalAset,
        totalLuas,
        totalNilai,
        totalNilaiBuku,
        totalNilaiNjop,
        totalSertifikat,
        totalBelumSertifikat: Math.max(totalAset - totalSertifikat, 0),
        totalLokasi,
        totalTanpaLokasi: Math.max(totalAset - totalLokasi, 0),
        totalLahanKosong,
        totalDigunakan,
        totalKoordinat,
        totalTanpaKoordinat: Math.max(totalAset - totalKoordinat, 0),
        totalPolygon,
        totalTanpaPolygon: Math.max(totalAset - totalPolygon, 0),
        totalOpdPengguna,
        totalKib,
        totalLuasKib,
        totalHargaPerolehanKib,
        totalKibTerplotting,
        totalPajak,
        totalPajakTerverifikasi,
        totalNjopBumiPajak,
        totalNjopBangunanPajak,
        totalPbbPemetaan,
        byStatus,
        byJenis,
        byJenisHak,
        byStatusHukum,
        byKecamatan,
        byJenisMasalah,
        byOpdPengguna,
        byPlottingStatus,
        bySumber,
        byReconciliationStatus,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get assets for map display
 * GET /api/aset/map
 */
export const getForMap = async (req, res) => {
  try {
    const { status } = req.query;

    const where = {
      koordinat_lat: { [Op.ne]: null },
      koordinat_long: { [Op.ne]: null },
    };
    appendExplicitSourceFilters(where, req.query);

    if (status) where.status = status;

    const assets = await Aset.findAll({
      where,
      attributes: [
        "id_aset",
        "kode_aset",
        "nama_aset",
        "lokasi",
        "koordinat_lat",
        "koordinat_long",
        "status",
        "luas",
        "jenis_aset",
      ],
    });

    res.json({
      success: true,
      data: assets,
    });
  } catch (error) {
    console.error("Error fetching map assets:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get asset by ID
 * GET /api/aset/:id
 */
export const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const asset = await Aset.findByPk(id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id_user", "nama_lengkap", "username"],
        },
        {
          model: Aset2dCatalog,
          as: "catalog2d",
          attributes: ["kode_2d", "status"],
          required: false,
        },
      ],
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: "Aset tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: {
        ...asset.toJSON(),
        kode_2d: asset.catalog2d?.kode_2d || null,
        catalog2d: undefined,
      },
    });
  } catch (error) {
    console.error("Error fetching asset:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Create new asset
 * POST /api/aset
 */
export const create = async (req, res) => {
  try {
    const {
      kode_aset,
      nama_aset,
      lokasi,
      koordinat_lat,
      koordinat_long,
      luas,
      status,
      jenis_masalah,
      jenis_aset,
      nilai_aset,
      tahun_perolehan,
      nomor_sertifikat,
      nomor_hak,
      status_sertifikat,
      foto_aset,
      dokumen_pendukung,
      keterangan,
      // Data Legal
      jenis_hak,
      atas_nama,
      tanggal_sertifikat,
      surat_ukur,
      produk,
      pemilik_pertama,
      pemilik_akhir,
      riwayat_perolehan,
      status_hukum,
      // Data Fisik
      kecamatan,
      desa_kelurahan,
      luas_lapangan,
      batas_utara,
      batas_selatan,
      batas_timur,
      batas_barat,
      penggunaan_saat_ini,
      nib,
      kw,
      // Data Administratif
      kode_bmd,
      nilai_buku,
      nilai_njop,
      sk_penetapan,
      opd_pengguna,
      nibar,
      id_pemda,
      kode_barang,
      no_register,
      luas_kib,
      harga_perolehan,
      penggunaan_kib,
      tanggal_scan,
      file_sertifikat,
      notes,
      plotting_status,
      // Data Pajak
      pajak_fid,
      pajak_status,
      nop,
      nama_wajib_pajak,
      nilai_bumi_per_m2,
      nilai_bangunan_per_m2,
      luas_bumi_bapenda,
      luas_bangunan_bapenda,
      luas_bumi_pemetaan,
      luas_bangunan_pemetaan,
      njop_bumi_pemetaan,
      njop_bangunan_pemetaan,
      pbb_pemetaan,
      volume_bangunan,
      tinggi_bangunan,
      sumber,
      // Data Spasial
      polygon_bidang,
      building_footprint,
      building_height_m,
      building_base_elevation_m,
      building_floors,
      building_height_source,
      building_height_quality,
      model_3d_lod,
      model_3d_source_crs,
      model_3d_recorded_at,
      model_3d_accuracy_m,
    } = req.body;

    // Validasi required fields
    if (!kode_aset || !nama_aset) {
      return res.status(400).json({
        success: false,
        error: "Kode aset dan nama aset wajib diisi",
      });
    }

    if (sumber && !normalizeSumber(sumber)) {
      return res.status(400).json({
        success: false,
        error: "Sumber aset harus BPN atau BPKA",
      });
    }

    // Check if kode_aset already exists
    const existingAset = await Aset.findOne({ where: { kode_aset } });
    if (existingAset) {
      return res.status(400).json({
        success: false,
        error: "Kode aset sudah digunakan",
      });
    }

    const polygonCentroid = getCentroidFromPolygonField(polygon_bidang);
    const asset3dData = normalizeAsset3dFields({
      building_footprint,
      building_height_m,
      building_base_elevation_m,
      building_floors,
      building_height_source,
      building_height_quality,
      model_3d_lod,
      model_3d_source_crs,
      model_3d_recorded_at,
      model_3d_accuracy_m,
    });

    const newAset = await sequelize.transaction(async (transaction) => {
      const createdAsset = await Aset.create({
      kode_aset,
      nama_aset,
      lokasi: lokasi || "-",
      koordinat_lat: koordinat_lat || polygonCentroid.lat || null,
      koordinat_long: koordinat_long || polygonCentroid.lng || null,
      luas: luas || null,
      status: status || "Aktif",
      jenis_masalah: jenis_masalah || null,
      jenis_aset: jenis_aset || null,
      nilai_aset: nilai_aset || null,
      tahun_perolehan: tahun_perolehan || null,
      nomor_sertifikat: nomor_sertifikat || null,
      nomor_hak: nomor_hak || null,
      status_sertifikat: status_sertifikat || null,
      foto_aset: foto_aset || null,
      dokumen_pendukung: dokumen_pendukung || null,
      keterangan: keterangan || null,
      // Data Legal
      jenis_hak: jenis_hak || null,
      atas_nama: atas_nama || null,
      tanggal_sertifikat: tanggal_sertifikat || null,
      surat_ukur: surat_ukur || null,
      produk: produk || null,
      pemilik_pertama: pemilik_pertama || null,
      pemilik_akhir: pemilik_akhir || null,
      riwayat_perolehan: riwayat_perolehan || null,
      status_hukum: status_hukum || null,
      // Data Fisik
      kecamatan: kecamatan || null,
      desa_kelurahan: desa_kelurahan || null,
      luas_lapangan: luas_lapangan || null,
      batas_utara: batas_utara || null,
      batas_selatan: batas_selatan || null,
      batas_timur: batas_timur || null,
      batas_barat: batas_barat || null,
      penggunaan_saat_ini: penggunaan_saat_ini || null,
      nib: nib || null,
      kw: kw || null,
      // Data Administratif
      kode_bmd: kode_bmd || null,
      nilai_buku: nilai_buku || null,
      nilai_njop: nilai_njop || null,
      sk_penetapan: sk_penetapan || null,
      opd_pengguna: opd_pengguna || null,
      nibar: nibar || null,
      id_pemda: id_pemda || null,
      kode_barang: kode_barang || null,
      no_register: no_register || null,
      luas_kib: luas_kib || null,
      harga_perolehan: harga_perolehan || null,
      penggunaan_kib: penggunaan_kib || null,
      tanggal_scan: tanggal_scan || null,
      file_sertifikat: file_sertifikat || null,
      notes: notes || null,
      plotting_status: plotting_status || null,
      // Data Pajak
      pajak_fid: pajak_fid ?? null,
      pajak_status: nop ? "Terverifikasi" : pajak_status || null,
      nop: nop || null,
      nama_wajib_pajak: nama_wajib_pajak || null,
      nilai_bumi_per_m2: nilai_bumi_per_m2 ?? null,
      nilai_bangunan_per_m2: nilai_bangunan_per_m2 ?? null,
      luas_bumi_bapenda: luas_bumi_bapenda ?? null,
      luas_bangunan_bapenda: luas_bangunan_bapenda ?? null,
      luas_bumi_pemetaan: luas_bumi_pemetaan ?? null,
      luas_bangunan_pemetaan: luas_bangunan_pemetaan ?? null,
      njop_bumi_pemetaan: njop_bumi_pemetaan ?? null,
      njop_bangunan_pemetaan: njop_bangunan_pemetaan ?? null,
      pbb_pemetaan: pbb_pemetaan ?? null,
      volume_bangunan: volume_bangunan ?? null,
      tinggi_bangunan: tinggi_bangunan ?? null,
      // Data Spasial
      polygon_bidang: polygon_bidang || null,
      ...asset3dData,
      sumber: normalizeSumber(sumber) || undefined,
      created_by: req.user.id_user,
      created_at: new Date(),
        updated_at: new Date(),
      }, { transaction });
      await Aset2dCatalog.create({
        kode_2d: `2D-${String(createdAsset.id_aset).padStart(6, "0")}`,
        id_aset: createdAsset.id_aset,
        status: "active",
        created_at: new Date(),
        updated_at: new Date(),
      }, { transaction });
      return createdAsset;
    });

    // Log audit
    await AuditService.logCreate({
      tabel: "aset",
      id_referensi: newAset.id_aset,
      data_baru: newAset.toJSON(),
      keterangan: `Menambahkan aset baru: ${newAset.nama_aset}`,
      user_id: req.user.id_user,
      req,
    });

    // Send notification
    const creator = await User.findByPk(req.user.id_user);
    await NotificationService.notifyAsetCreated(
      newAset.toJSON(),
      creator?.nama_lengkap || req.user.username,
    );

    res.status(201).json({
      success: true,
      message: "Aset berhasil ditambahkan",
      data: {
        ...newAset.toJSON(),
        kode_2d: `2D-${String(newAset.id_aset).padStart(6, "0")}`,
      },
    });
  } catch (error) {
    console.error("Error creating asset:", error);
    res.status(error instanceof Asset3dValidationError ? 400 : 500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Update asset
 * PUT /api/aset/:id
 */
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const asset = await Aset.findByPk(id);
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: "Aset tidak ditemukan",
      });
    }

    // If kode_aset is being changed, check if new one already exists
    if (updateData.kode_aset && updateData.kode_aset !== asset.kode_aset) {
      const existingAset = await Aset.findOne({
        where: { kode_aset: updateData.kode_aset },
      });
      if (existingAset) {
        return res.status(400).json({
          success: false,
          error: "Kode aset sudah digunakan",
        });
      }
    }

    if (Object.prototype.hasOwnProperty.call(updateData, "sumber")) {
      const normalizedSumber = normalizeSumber(updateData.sumber);
      if (!normalizedSumber) {
        return res.status(400).json({
          success: false,
          error: "Sumber aset harus BPN atau BPKA",
        });
      }
      updateData.sumber = normalizedSumber;
    }

    Object.assign(updateData, normalizeAsset3dFields(updateData, { partial: true }));
    if (Object.prototype.hasOwnProperty.call(updateData, "nop")) {
      updateData.pajak_status = updateData.nop ? "Terverifikasi" : null;
    }

    const polygonWasImported = updateData._polygon_imported === true;
    delete updateData._polygon_imported;

    if (Object.prototype.hasOwnProperty.call(updateData, "polygon_bidang")) {
      const polygonCentroid = getCentroidFromPolygonField(
        updateData.polygon_bidang,
      );
      if (polygonCentroid.lat && polygonCentroid.lng) {
        updateData.koordinat_lat =
          polygonWasImported || !updateData.koordinat_lat
            ? polygonCentroid.lat
            : updateData.koordinat_lat;
        updateData.koordinat_long =
          polygonWasImported || !updateData.koordinat_long
            ? polygonCentroid.lng
            : updateData.koordinat_long;
      }
    }

    // Update timestamp
    updateData.updated_at = new Date();

    // Store old data for audit
    const oldData = asset.toJSON();

    await asset.update(updateData);

    // Fetch updated asset with creator info
    const updatedAsset = await Aset.findByPk(id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id_user", "nama_lengkap", "username"],
        },
      ],
    });

    // Log audit
    await AuditService.logUpdate({
      tabel: "aset",
      id_referensi: parseInt(id),
      data_lama: oldData,
      data_baru: updatedAsset.toJSON(),
      keterangan: `Memperbarui aset: ${updatedAsset.nama_aset}`,
      user_id: req.user.id_user,
      req,
    });

    // Send notification if status changed
    const updater = await User.findByPk(req.user.id_user);
    const updaterName = updater?.nama_lengkap || req.user.username;

    if (updateData.status && updateData.status !== oldData.status) {
      await NotificationService.notifyAsetStatusChanged(
        updatedAsset.toJSON(),
        oldData.status,
        updateData.status,
        updaterName,
      );
    } else {
      await NotificationService.notifyAsetUpdated(
        updatedAsset.toJSON(),
        updaterName,
      );
    }

    res.json({
      success: true,
      message: "Aset berhasil diperbarui",
      data: updatedAsset,
    });
  } catch (error) {
    console.error("Error updating asset:", error);
    res.status(error instanceof Asset3dValidationError ? 400 : 500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Delete asset
 * DELETE /api/aset/:id
 */
export const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const asset = await Aset.findByPk(id);
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: "Aset tidak ditemukan",
      });
    }

    // Store data for audit before delete
    const deletedData = asset.toJSON();

    await asset.destroy();

    // Log audit
    await AuditService.logDelete({
      tabel: "aset",
      id_referensi: parseInt(id),
      data_lama: deletedData,
      keterangan: `Menghapus aset: ${deletedData.nama_aset}`,
      user_id: req.user.id_user,
      req,
    });

    // Send notification
    const deleter = await User.findByPk(req.user.id_user);
    await NotificationService.notifyAsetDeleted(
      deletedData,
      deleter?.nama_lengkap || req.user.username,
    );

    res.json({
      success: true,
      message: "Aset berhasil dihapus",
      data: { id_aset: parseInt(id) },
    });
  } catch (error) {
    console.error("Error deleting asset:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
