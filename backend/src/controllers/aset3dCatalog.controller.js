import { Op, Sequelize } from "sequelize";
import {
  Aset,
  Aset3dCatalog,
  AsetModel3d,
  sequelize,
} from "../models/index.js";
import AuditService from "../services/audit.service.js";
import { createKode3dCandidate } from "../utils/asset3dCatalog.js";

const toPositiveInteger = (value, fallback, maximum = 100) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
};

const assetAttributes = [
  "id_aset",
  "kode_aset",
  "nama_aset",
  "jenis_aset",
  "lokasi",
  "nib",
  "nibar",
  "status_sertifikat",
  "nomor_sertifikat",
  "jenis_hak",
  "atas_nama",
  "penggunaan_saat_ini",
  "luas",
  "luas_lapangan",
  "tahun_perolehan",
  "keterangan",
  "desa_kelurahan",
  "kecamatan",
  "opd_pengguna",
  "sumber",
  "koordinat_lat",
  "koordinat_long",
  "polygon_bidang",
  "building_height_m",
  "building_base_elevation_m",
  "building_floors",
  "building_height_source",
  "building_height_quality",
  "model_3d_lod",
  "model_3d_source_crs",
  "model_3d_recorded_at",
  "model_3d_accuracy_m",
];

const modelAttributes = [
  "id_model_3d",
  "lod",
  "version",
  "is_active",
  "status",
  "conversion_status",
  "review_status",
  "format",
  "model_type",
  "public_url",
  "converted_public_url",
  "location_lat",
  "location_long",
  "uploaded_at",
  "updated_at",
  "archived_at",
];

export const serializeCatalog = (record) => {
  const value = record.toJSON ? record.toJSON() : record;
  const models = (value.aset?.models3d || []).filter(
    (model) => !model.archived_at && model.status !== "archived",
  );
  const activeModel = models.find((model) => model.is_active) || models[0] || null;
  const centerX = activeModel?.location_long ?? value.aset?.koordinat_long ?? null;
  const centerY = activeModel?.location_lat ?? value.aset?.koordinat_lat ?? null;
  return {
    kode_3d: value.kode_3d,
    status: value.status,
    created_by: value.created_by,
    created_at: value.created_at,
    updated_at: value.updated_at,
    asset: value.aset ? { ...value.aset, models3d: undefined } : null,
    model_count: models.length,
    active_model: activeModel,
    active_models: models.filter((model) => model.is_active),
    model_status: activeModel?.review_status || activeModel?.conversion_status || "belum_ada",
    category: "Bangunan",
    model_format: activeModel?.format || activeModel?.model_type || null,
    center_x: centerX,
    center_y: centerY,
    model_url: activeModel?.converted_public_url || activeModel?.public_url || null,
    model_updated_at: activeModel?.updated_at || value.updated_at,
  };
};

const catalogInclude = {
  model: Aset,
  as: "aset",
  required: true,
  attributes: assetAttributes,
  include: [{
    model: AsetModel3d,
    as: "models3d",
    attributes: modelAttributes,
    required: false,
    separate: true,
    order: [["version", "DESC"]],
  }],
};

const catalogOrder = (sort, order) => {
  const direction = String(order).toUpperCase() === "ASC" ? "ASC" : "DESC";
  if (sort === "kode_aset" || sort === "nama_aset") {
    return [[{ model: Aset, as: "aset" }, sort, direction]];
  }
  if (sort === "kode_3d") return [["kode_3d", direction]];
  if (sort === "status") return [["status", direction]];
  if (sort === "model_updated_at") {
    return [[Sequelize.literal(`COALESCE((
      SELECT MAX(sort_model."updated_at")
      FROM "aset_model_3d" sort_model
      WHERE sort_model."id_aset" = "Aset3dCatalog"."id_aset"
        AND sort_model."archived_at" IS NULL
    ), "Aset3dCatalog"."updated_at")`), direction]];
  }
  if (sort === "center_x" || sort === "center_y") {
    const modelColumn = sort === "center_x" ? "location_long" : "location_lat";
    const assetColumn = sort === "center_x" ? "koordinat_long" : "koordinat_lat";
    return [[Sequelize.literal(`COALESCE((
      SELECT center_sort."${modelColumn}"
      FROM "aset_model_3d" center_sort
      WHERE center_sort."id_aset" = "Aset3dCatalog"."id_aset"
        AND center_sort."archived_at" IS NULL
      ORDER BY center_sort."is_active" DESC, center_sort."version" DESC
      LIMIT 1
    ), "aset"."${assetColumn}")`), direction]];
  }
  if (sort === "updated_at") return [["updated_at", direction]];
  return [["created_at", direction]];
};

const buildCatalogWhere = (query) => {
  const where = {};
  const search = String(query.search || "").trim();
  const modelStatus = String(query.model_status || "all");
  const catalogStatus = String(query.catalog_status || "all");
  const reviewStatus = String(query.review_status || "all");
  const format = String(query.format || "all").toUpperCase();
  const centerStatus = String(query.center_status || "all");
  const conditions = [];

  if (search) {
    where[Op.or] = [
      { kode_3d: { [Op.iLike]: `%${search}%` } },
      { "$aset.kode_aset$": { [Op.iLike]: `%${search}%` } },
      { "$aset.nama_aset$": { [Op.iLike]: `%${search}%` } },
      { "$aset.lokasi$": { [Op.iLike]: `%${search}%` } },
    ];
  }
  if (["active", "inactive"].includes(catalogStatus)) where.status = catalogStatus;
  if (["with_model", "without_model"].includes(modelStatus)) {
    const exists = modelStatus === "with_model" ? "EXISTS" : "NOT EXISTS";
    conditions.push(Sequelize.literal(`${exists} (
      SELECT 1 FROM "aset_model_3d" model_filter
      WHERE model_filter."id_aset" = "Aset3dCatalog"."id_aset"
        AND model_filter."archived_at" IS NULL
        AND model_filter."status" <> 'archived'
    )`));
  }
  const validReviewStatuses = [
    "draft", "processing", "needs_review", "verified", "rejected", "active", "expired",
  ];
  if (validReviewStatuses.includes(reviewStatus)) {
    conditions.push(Sequelize.literal(`EXISTS (
      SELECT 1 FROM "aset_model_3d" review_filter
      WHERE review_filter."id_aset" = "Aset3dCatalog"."id_aset"
        AND review_filter."archived_at" IS NULL
        AND review_filter."review_status" = ${sequelize.escape(reviewStatus)}
    )`));
  }
  if (["KMZ", "GLB", "3DTILES"].includes(format)) {
    conditions.push(Sequelize.literal(`EXISTS (
      SELECT 1 FROM "aset_model_3d" format_filter
      WHERE format_filter."id_aset" = "Aset3dCatalog"."id_aset"
        AND format_filter."archived_at" IS NULL
        AND UPPER(format_filter."format") = ${sequelize.escape(format)}
    )`));
  }
  if (["with_center", "without_center"].includes(centerStatus)) {
    const hasCenter = `(
      ("aset"."koordinat_long" IS NOT NULL AND "aset"."koordinat_lat" IS NOT NULL)
      OR EXISTS (
        SELECT 1 FROM "aset_model_3d" center_filter
        WHERE center_filter."id_aset" = "Aset3dCatalog"."id_aset"
          AND center_filter."archived_at" IS NULL
          AND center_filter."location_long" IS NOT NULL
          AND center_filter."location_lat" IS NOT NULL
      )
    )`;
    conditions.push(Sequelize.literal(
      centerStatus === "with_center" ? hasCenter : `NOT ${hasCenter}`,
    ));
  }
  if (conditions.length > 0) where[Op.and] = conditions;
  return where;
};

export const list = async (req, res) => {
  try {
    const page = toPositiveInteger(req.query.page, 1, 100000);
    const limit = toPositiveInteger(req.query.limit, 10, 100);
    const where = buildCatalogWhere(req.query);

    const { count, rows } = await Aset3dCatalog.findAndCountAll({
      where,
      include: [catalogInclude],
      distinct: true,
      subQuery: false,
      limit,
      offset: (page - 1) * limit,
      order: catalogOrder(req.query.sort, req.query.order),
    });

    return res.json({
      success: true,
      data: rows.map(serializeCatalog),
      pagination: {
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(count / limit)),
        totalItems: count,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Error listing 3D catalog:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const csvCell = (value) => {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
};

export const exportCsv = async (req, res) => {
  try {
    const rows = await Aset3dCatalog.findAll({
      where: buildCatalogWhere(req.query),
      include: [catalogInclude],
      order: catalogOrder(req.query.sort, req.query.order),
    });
    const headers = [
      "kode_3d", "kode_aset", "nama_aset", "kategori", "status_katalog", "status_model",
      "format", "center_x", "center_y", "url_model", "dibuat", "diperbarui",
    ];
    const body = rows.map(serializeCatalog).map((item) => [
      item.kode_3d,
      item.asset?.kode_aset,
      item.asset?.nama_aset,
      item.category,
      item.status,
      item.model_status,
      item.model_format,
      item.center_x,
      item.center_y,
      item.model_url,
      item.created_at?.toISOString?.() || item.created_at,
      item.model_updated_at?.toISOString?.() || item.model_updated_at,
    ].map(csvCell).join(","));
    const csv = `\uFEFF${[headers.join(","), ...body].join("\r\n")}`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="katalog-3d-${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    return res.send(csv);
  } catch (error) {
    console.error("Error exporting 3D catalog:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const candidates = async (req, res) => {
  try {
    const page = toPositiveInteger(req.query.page, 1, 100000);
    const limit = toPositiveInteger(req.query.limit, 8, 50);
    const search = String(req.query.search || "").trim();
    const where = {
      id_aset: {
        [Op.notIn]: Sequelize.literal(
          '(SELECT "id_aset" FROM "aset_3d_catalog")',
        ),
      },
    };

    if (search) {
      where[Op.or] = [
        { kode_aset: { [Op.iLike]: `%${search}%` } },
        { nama_aset: { [Op.iLike]: `%${search}%` } },
        { lokasi: { [Op.iLike]: `%${search}%` } },
        { opd_pengguna: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Aset.findAndCountAll({
      where,
      attributes: assetAttributes,
      limit,
      offset: (page - 1) * limit,
      order: [["kode_aset", "ASC"]],
    });

    return res.json({
      success: true,
      data: rows,
      pagination: {
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(count / limit)),
        totalItems: count,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Error listing 3D catalog candidates:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getByCode = async (req, res) => {
  try {
    const catalog = await Aset3dCatalog.findByPk(req.params.kode3d, {
      include: [catalogInclude],
    });
    if (!catalog) {
      return res.status(404).json({ success: false, error: "Aset Kelola 3D tidak ditemukan" });
    }
    return res.json({ success: true, data: serializeCatalog(catalog) });
  } catch (error) {
    console.error("Error fetching 3D catalog detail:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const asset = req.body?.id_aset
      ? await Aset.findByPk(req.body.id_aset)
      : await Aset.findOne({ where: { kode_aset: req.body?.kode_aset } });
    if (!asset) {
      return res.status(404).json({ success: false, error: "Aset tidak ditemukan" });
    }

    const existing = await Aset3dCatalog.findOne({ where: { id_aset: asset.id_aset } });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: `Aset sudah terdaftar dengan kode 3D ${existing.kode_3d}`,
        data: { kode_3d: existing.kode_3d },
      });
    }

    let sequence = 1;
    let kode3d = createKode3dCandidate(asset.kode_aset, sequence, asset.id_aset);
    while (await Aset3dCatalog.findByPk(kode3d, { attributes: ["kode_3d"] })) {
      sequence += 1;
      kode3d = createKode3dCandidate(asset.kode_aset, sequence, asset.id_aset);
    }

    const catalog = await Aset3dCatalog.create({
      kode_3d: kode3d,
      id_aset: asset.id_aset,
      status: "active",
      created_by: req.user.id_user,
    });

    await AuditService.logCreate({
      tabel: "aset_3d_catalog",
      id_referensi: asset.id_aset,
      data_baru: catalog.toJSON(),
      keterangan: `Menambahkan aset ${asset.kode_aset} ke Kelola 3D sebagai ${kode3d}`,
      user_id: req.user.id_user,
      req,
    });

    const created = await Aset3dCatalog.findByPk(kode3d, {
      include: [catalogInclude],
    });
    return res.status(201).json({
      success: true,
      message: `Aset berhasil ditambahkan dengan kode 3D ${kode3d}`,
      data: serializeCatalog(created),
    });
  } catch (error) {
    console.error("Error creating 3D catalog:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const catalog = await Aset3dCatalog.findByPk(req.params.kode3d, {
      include: [{ model: Aset, as: "aset", attributes: ["kode_aset", "nama_aset"] }],
    });
    if (!catalog) {
      return res.status(404).json({ success: false, error: "Aset Kelola 3D tidak ditemukan" });
    }

    const oldData = catalog.toJSON();
    const activeModels = await AsetModel3d.findAll({
      where: { id_aset: catalog.id_aset, archived_at: null },
      attributes: ["id_model_3d", "version"],
    });
    const archivedAt = new Date();

    await sequelize.transaction(async (transaction) => {
      if (activeModels.length > 0) {
        await AsetModel3d.update({
          is_active: false,
          status: "archived",
          archived_at: archivedAt,
          updated_at: archivedAt,
        }, {
          where: { id_aset: catalog.id_aset, archived_at: null },
          transaction,
        });
      }
      await catalog.destroy({ transaction });
    });

    await AuditService.logDelete({
      tabel: "aset_3d_catalog",
      id_referensi: catalog.id_aset,
      data_lama: {
        ...oldData,
        archived_models: activeModels.map((model) => ({
          id_model_3d: model.id_model_3d,
          version: model.version,
        })),
      },
      keterangan: `Menghapus ${catalog.kode_3d} dari Kelola 3D dan mengarsipkan ${activeModels.length} versi model`,
      user_id: req.user.id_user,
      req,
    });

    return res.json({
      success: true,
      message: activeModels.length > 0
        ? `Aset 3D dihapus dan ${activeModels.length} versi model diarsipkan`
        : "Aset 3D dihapus dari Kelola 3D",
      data: {
        kode_3d: catalog.kode_3d,
        archived_model_count: activeModels.length,
      },
    });
  } catch (error) {
    console.error("Error removing 3D catalog:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
