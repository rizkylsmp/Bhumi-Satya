const LEGACY_SORT_FIELD_MAP = {
  id_pusat_data: "id_aset",
  alamat: "lokasi",
  kelurahan: "desa_kelurahan",
  penggunaan: "penggunaan_saat_ini",
  opd: "opd_pengguna",
};

const ALLOWED_SORT_FIELDS = new Set([
  "id_aset",
  "kode_aset",
  "nama_aset",
  "created_at",
  "updated_at",
  "lokasi",
  "desa_kelurahan",
  "penggunaan_saat_ini",
  "opd_pengguna",
  "luas",
  "status",
  "sumber",
]);

const asPlainObject = (value) => {
  if (!value) return value;
  return typeof value.toJSON === "function" ? value.toJSON() : value;
};

export const toLegacyPusatData = (asset) => {
  const plain = asPlainObject(asset);
  if (!plain) return plain;

  return {
    ...plain,
    id_pusat_data: plain.id_aset,
    alamat: plain.lokasi,
    kelurahan: plain.desa_kelurahan,
    penggunaan: plain.penggunaan_saat_ini,
    opd: plain.opd_pengguna,
    master_table: "aset",
  };
};

export const normalizeLegacyListQuery = (query = {}) => {
  const requestedSort = LEGACY_SORT_FIELD_MAP[query.sortBy] || query.sortBy;
  const sort = ALLOWED_SORT_FIELDS.has(requestedSort)
    ? requestedSort
    : "created_at";

  return {
    ...query,
    sort,
    order: String(query.sortOrder || query.order || "DESC").toUpperCase() ===
      "ASC"
      ? "ASC"
      : "DESC",
    opd_pengguna: query.opd_pengguna || query.opd,
    desa_kelurahan: query.desa_kelurahan || query.kelurahan,
  };
};

export const adaptLegacyListPayload = (payload = {}) => ({
  data: (payload.data || []).map(toLegacyPusatData),
  pagination: {
    total: payload.pagination?.totalItems || 0,
    page: payload.pagination?.currentPage || 1,
    limit: payload.pagination?.itemsPerPage || 20,
    totalPages: payload.pagination?.totalPages || 1,
  },
  deprecated: true,
  successor: "/api/aset",
});

export const adaptLegacyDetailPayload = (payload = {}) => ({
  data: toLegacyPusatData(payload.data),
  deprecated: true,
  successor: "/api/aset/:id",
});

export const adaptLegacyStatsPayload = (payload = {}) => {
  const stats = payload.data || {};

  return {
    total: stats.totalAset || 0,
    totalLuas: stats.totalLuas || 0,
    sertifikatStats: [
      {
        status_sertifikat: "Telah Bersertifikat",
        count: stats.totalSertifikat || 0,
      },
      {
        status_sertifikat: "Belum Bersertifikat",
        count: stats.totalBelumSertifikat || 0,
      },
    ],
    bySumber: stats.bySumber || {},
    byReconciliationStatus: stats.byReconciliationStatus || {},
    deprecated: true,
    successor: "/api/aset/stats",
  };
};

export const deprecationHeaders = (req, res, next) => {
  res.set("Deprecation", "true");
  res.set("Link", '</api/aset>; rel="successor-version"');
  res.set("Warning", '299 - "Endpoint /api/pusat-data deprecated; gunakan /api/aset"');
  next();
};

export const normalizeLegacyQuery = (req, _res, next) => {
  req.query = normalizeLegacyListQuery(req.query);
  next();
};

export const adaptJsonResponse = (transformer) => (_req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (payload) => {
    if (res.statusCode >= 400 || payload?.success === false) {
      return originalJson(payload);
    }
    return originalJson(transformer(payload));
  };
  next();
};

export const rejectLegacyMutation = (_req, res) =>
  res.status(410).json({
    success: false,
    error: "Endpoint mutasi pusat-data sudah dinonaktifkan",
    message: "Gunakan endpoint master aset /api/aset",
    successor: "/api/aset",
  });
