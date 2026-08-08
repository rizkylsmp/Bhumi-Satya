import { Op, Sequelize } from "sequelize";
import {
  Aset,
  Aset2dCatalog,
  Aset3dCatalog,
} from "../models/index.js";
import AuditService from "../services/audit.service.js";

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
  "kecamatan",
  "desa_kelurahan",
  "luas",
  "koordinat_lat",
  "koordinat_long",
  "polygon_bidang",
  "updated_at",
];

export const hasCoordinates = (asset) => {
  const latitude = Number(asset?.koordinat_lat);
  const longitude = Number(asset?.koordinat_long);
  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude !== 0
    && longitude !== 0;
};

export const hasPolygon = (asset) => {
  const polygon = asset?.polygon_bidang;
  if (!polygon) return false;
  if (typeof polygon === "string") {
    return !["null", "\"\"", "[]", "{}"].includes(polygon.trim());
  }
  return Array.isArray(polygon) ? polygon.length > 0 : true;
};

export const summarizeDigitalTwinCoverage = (total, linked) => {
  const normalizedTotal = Math.max(0, Number(total) || 0);
  const normalizedLinked = Math.min(
    normalizedTotal,
    Math.max(0, Number(linked) || 0),
  );
  return {
    totalWithBuildings: normalizedLinked,
    totalWithoutBuildings: normalizedTotal - normalizedLinked,
  };
};

export const serializeCatalog = (record) => {
  const value = record.toJSON ? record.toJSON() : record;
  return {
    kode_2d: value.kode_2d,
    id_aset: value.id_aset,
    status: value.status,
    is_managed: value.is_managed,
    created_at: value.created_at,
    updated_at: value.updated_at,
    building_count: Number(value.building_count || 0),
    has_coordinates: hasCoordinates(value.aset),
    has_polygon: hasPolygon(value.aset),
    asset: value.aset || null,
  };
};

export const buildCodeBase = (asset) => {
  const normalized = String(asset.kode_aset || asset.id_aset)
    .toUpperCase()
    .normalize("NFKD")
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
  return `2D-${normalized || String(asset.id_aset).padStart(6, "0")}`;
};

const createUniqueCode = async (asset) => {
  const base = buildCodeBase(asset);
  let candidate = base;
  let sequence = 2;
  while (await Aset2dCatalog.findByPk(candidate, { attributes: ["kode_2d"] })) {
    const suffix = `-${sequence}`;
    candidate = `${base.slice(0, 40 - suffix.length)}${suffix}`;
    sequence += 1;
  }
  return candidate;
};

const catalogOrder = (sort, order) => {
  const direction = String(order).toUpperCase() === "ASC" ? "ASC" : "DESC";
  if (["kode_aset", "nama_aset", "lokasi"].includes(sort)) {
    return [[{ model: Aset, as: "aset" }, sort, direction]];
  }
  if (sort === "kode_2d") return [["kode_2d", direction]];
  if (sort === "created_at") return [["created_at", direction]];
  return [["updated_at", direction]];
};

export const list = async (req, res) => {
  try {
    const page = toPositiveInteger(req.query.page, 1, 100000);
    const limit = toPositiveInteger(req.query.limit, 10, 100);
    const search = String(req.query.search || "").trim();
    const geometry = String(req.query.geometry || "all");
    const coordinateStatus = String(req.query.coordinate_status || "all");
    const polygonStatus = String(req.query.polygon_status || "all");
    const buildingStatus = String(req.query.building_status || "all");
    const where = { is_managed: true };
    const conditions = [];

    if (search) {
      where[Op.or] = [
        { kode_2d: { [Op.iLike]: `%${search}%` } },
        { "$aset.kode_aset$": { [Op.iLike]: `%${search}%` } },
        { "$aset.nama_aset$": { [Op.iLike]: `%${search}%` } },
        { "$aset.lokasi$": { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (geometry === "complete") {
      conditions.push(Sequelize.literal(`
        "aset"."koordinat_lat" IS NOT NULL
        AND "aset"."koordinat_long" IS NOT NULL
        AND "aset"."polygon_bidang" IS NOT NULL
        AND "aset"."polygon_bidang"::text NOT IN ('null', '""', '[]', '{}')
      `));
    } else if (geometry === "incomplete") {
      conditions.push(Sequelize.literal(`
        "aset"."koordinat_lat" IS NULL
        OR "aset"."koordinat_long" IS NULL
        OR "aset"."polygon_bidang" IS NULL
        OR "aset"."polygon_bidang"::text IN ('null', '""', '[]', '{}')
      `));
    }
    if (["available", "missing"].includes(coordinateStatus)) {
      const hasCoordinate = `(
        "aset"."koordinat_lat" IS NOT NULL
        AND "aset"."koordinat_long" IS NOT NULL
        AND CAST("aset"."koordinat_lat" AS FLOAT) <> 0
        AND CAST("aset"."koordinat_long" AS FLOAT) <> 0
      )`;
      conditions.push(Sequelize.literal(
        coordinateStatus === "available" ? hasCoordinate : `NOT ${hasCoordinate}`,
      ));
    }
    if (["available", "missing"].includes(polygonStatus)) {
      const hasPolygonData = `(
        "aset"."polygon_bidang" IS NOT NULL
        AND "aset"."polygon_bidang"::text NOT IN ('null', '""', '[]', '{}')
      )`;
      conditions.push(Sequelize.literal(
        polygonStatus === "available" ? hasPolygonData : `NOT ${hasPolygonData}`,
      ));
    }
    if (["linked", "unlinked"].includes(buildingStatus)) {
      const hasBuilding = `EXISTS (
        SELECT 1 FROM "aset_3d_catalog" building_filter
        WHERE building_filter."kode_2d" = "Aset2dCatalog"."kode_2d"
      )`;
      conditions.push(Sequelize.literal(
        buildingStatus === "linked" ? hasBuilding : `NOT ${hasBuilding}`,
      ));
    }
    if (conditions.length > 0) where[Op.and] = conditions;

    const { count, rows } = await Aset2dCatalog.findAndCountAll({
      where,
      attributes: [
        "kode_2d",
        "id_aset",
        "status",
        "is_managed",
        "created_at",
        "updated_at",
        [Sequelize.literal(`(
          SELECT COUNT(*)
          FROM "aset_3d_catalog" building
          WHERE building."kode_2d" = "Aset2dCatalog"."kode_2d"
        )`), "building_count"],
      ],
      include: [{
        model: Aset,
        as: "aset",
        required: true,
        attributes: assetAttributes,
      }],
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
    console.error("Error listing 2D catalog:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const candidates = async (req, res) => {
  try {
    const page = toPositiveInteger(req.query.page, 1, 100000);
    const limit = toPositiveInteger(req.query.limit, 8, 50);
    const search = String(req.query.search || "").trim();
    const where = {
      [Op.and]: [Sequelize.literal(`NOT EXISTS (
        SELECT 1
        FROM "aset_2d_catalog" candidate_catalog
        WHERE candidate_catalog."id_aset" = "Aset"."id_aset"
          AND candidate_catalog."is_managed" = TRUE
      )`)],
    };
    if (search) {
      where[Op.and].push({
        [Op.or]: [
          { kode_aset: { [Op.iLike]: `%${search}%` } },
          { nama_aset: { [Op.iLike]: `%${search}%` } },
          { lokasi: { [Op.iLike]: `%${search}%` } },
          { kecamatan: { [Op.iLike]: `%${search}%` } },
          { desa_kelurahan: { [Op.iLike]: `%${search}%` } },
        ],
      });
    }

    const { count, rows } = await Aset.findAndCountAll({
      where,
      attributes: assetAttributes,
      limit,
      offset: (page - 1) * limit,
      order: [["nama_aset", "ASC"]],
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
    console.error("Error listing 2D catalog candidates:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const stats = async (_req, res) => {
  try {
    const base = { is_managed: true };
    const [
      total,
      totalCoordinates,
      totalPolygon,
      totalWithBuildings,
      buildingCountRows,
    ] = await Promise.all([
      Aset2dCatalog.count({ where: base }),
      Aset2dCatalog.count({
        where: base,
        include: [{
          model: Aset,
          as: "aset",
          required: true,
          where: {
            [Op.and]: [
              Sequelize.literal('"aset"."koordinat_lat" IS NOT NULL'),
              Sequelize.literal('"aset"."koordinat_long" IS NOT NULL'),
              Sequelize.literal('CAST("aset"."koordinat_lat" AS FLOAT) <> 0'),
              Sequelize.literal('CAST("aset"."koordinat_long" AS FLOAT) <> 0'),
            ],
          },
        }],
      }),
      Aset2dCatalog.count({
        where: base,
        include: [{
          model: Aset,
          as: "aset",
          required: true,
          where: {
            [Op.and]: [Sequelize.literal(`
              "aset"."polygon_bidang" IS NOT NULL
              AND "aset"."polygon_bidang"::text NOT IN ('null', '""', '[]', '{}')
            `)],
          },
        }],
      }),
      Aset2dCatalog.count({
        where: base,
        include: [{
          model: Aset3dCatalog,
          as: "buildings3d",
          required: true,
          attributes: [],
        }],
        distinct: true,
        col: "kode_2d",
      }),
      Aset2dCatalog.findAll({
        where: base,
        attributes: [
          "kode_2d",
          [Sequelize.literal(`(
            SELECT COUNT(*)
            FROM "aset_3d_catalog" building_count
            WHERE building_count."kode_2d" = "Aset2dCatalog"."kode_2d"
          )`), "building_count"],
        ],
        order: [
          [Sequelize.literal('"building_count"'), "DESC"],
          ["kode_2d", "ASC"],
        ],
        limit: 8,
        raw: true,
      }),
    ]);
    const buildingsPerParcel = buildingCountRows.map((row) => ({
      kode_2d: row.kode_2d,
      building_count: Number(row.building_count || 0),
    }));

    const coverage = summarizeDigitalTwinCoverage(total, totalWithBuildings);
    return res.json({
      success: true,
      data: {
        total,
        totalCoordinates,
        totalPolygon,
        ...coverage,
        buildingsPerParcel,
      },
    });
  } catch (error) {
    console.error("Error fetching 2D catalog stats:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const kodeAset = String(req.body?.kode_aset || "").trim();
    if (!kodeAset) {
      return res.status(400).json({ success: false, error: "Kode bangunan wajib dipilih" });
    }
    const asset = await Aset.findOne({ where: { kode_aset: kodeAset } });
    if (!asset) {
      return res.status(404).json({ success: false, error: "Aset Pusat Data tidak ditemukan" });
    }

    const existing = await Aset2dCatalog.findOne({ where: { id_aset: asset.id_aset } });
    let catalog;
    if (existing) {
      if (existing.is_managed) {
        return res.status(409).json({ success: false, error: "Aset sudah berada di Kelola 2D" });
      }
      const oldData = existing.toJSON();
      await existing.update({
        is_managed: true,
        status: "active",
        updated_at: new Date(),
      });
      catalog = existing;
      await AuditService.logUpdate({
        tabel: "aset_2d_catalog",
        id_referensi: asset.id_aset,
        data_lama: oldData,
        data_baru: catalog.toJSON(),
        keterangan: `Menambahkan kembali ${catalog.kode_2d} ke Kelola 2D`,
        user_id: req.user.id_user,
        req,
      });
    } else {
      catalog = await Aset2dCatalog.create({
        kode_2d: await createUniqueCode(asset),
        id_aset: asset.id_aset,
        status: "active",
        is_managed: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
      await AuditService.logCreate({
        tabel: "aset_2d_catalog",
        id_referensi: asset.id_aset,
        data_baru: catalog.toJSON(),
        keterangan: `Menambahkan bidang ${catalog.kode_2d} dari aset ${asset.kode_aset}`,
        user_id: req.user.id_user,
        req,
      });
    }

    return res.status(201).json({
      success: true,
      message: `Aset ditambahkan ke Kelola 2D sebagai ${catalog.kode_2d}`,
      data: serializeCatalog({ ...catalog.toJSON(), aset: asset.toJSON() }),
    });
  } catch (error) {
    console.error("Error creating 2D catalog:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const catalog = await Aset2dCatalog.findByPk(req.params.kode2d);
    if (!catalog?.is_managed) {
      return res.status(404).json({ success: false, error: "Bidang Kelola 2D tidak ditemukan" });
    }
    const buildingCount = await Aset3dCatalog.count({
      where: { kode_2d: catalog.kode_2d },
    });
    if (buildingCount > 0) {
      return res.status(409).json({
        success: false,
        error: `Bidang masih memiliki ${buildingCount} bangunan 3D. Hapus bangunan 3D terlebih dahulu.`,
      });
    }

    const oldData = catalog.toJSON();
    await catalog.update({
      is_managed: false,
      status: "inactive",
      updated_at: new Date(),
    });
    await AuditService.logUpdate({
      tabel: "aset_2d_catalog",
      id_referensi: catalog.id_aset,
      data_lama: oldData,
      data_baru: catalog.toJSON(),
      keterangan: `Mengeluarkan ${catalog.kode_2d} dari Kelola 2D`,
      user_id: req.user.id_user,
      req,
    });

    return res.json({ success: true, message: "Bidang dikeluarkan dari Kelola 2D" });
  } catch (error) {
    console.error("Error removing 2D catalog:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
