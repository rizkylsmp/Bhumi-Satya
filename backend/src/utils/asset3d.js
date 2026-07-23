const ALLOWED_LODS = new Set(["LOD0", "LOD1", "LOD2"]);
const ALLOWED_SOURCES = new Set([
  "survey",
  "lidar",
  "photogrammetry",
  "document",
  "floor_estimate",
  "model_3d",
  "other",
]);
const ALLOWED_QUALITIES = new Set(["measured", "derived", "estimated"]);

export class Asset3dValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "Asset3dValidationError";
  }
}

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

const optionalNumber = (value, label, { min, max, integer = false }) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || (integer && !Number.isInteger(parsed))) {
    throw new Asset3dValidationError(
      `${label} harus berupa ${integer ? "bilangan bulat" : "angka"}`,
    );
  }
  if (parsed < min || parsed > max) {
    throw new Asset3dValidationError(`${label} harus berada di antara ${min} dan ${max}`);
  }
  return parsed;
};

const optionalEnum = (value, label, allowed, transform = (item) => item) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const normalized = transform(String(value).trim());
  if (!allowed.has(normalized)) throw new Asset3dValidationError(`${label} tidak valid`);
  return normalized;
};

const validateFootprint = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  let parsed = value;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      throw new Asset3dValidationError("Tapak bangunan harus berupa JSON yang valid");
    }
  }
  const points = Array.isArray(parsed)
    ? parsed
    : parsed?.type === "Feature"
      ? parsed.geometry?.coordinates?.[0]
      : parsed?.type === "Polygon"
        ? parsed.coordinates?.[0]
        : null;
  if (!Array.isArray(points) || points.length < 3) {
    throw new Asset3dValidationError("Tapak bangunan minimal memiliki 3 titik polygon");
  }
  points.forEach((point) => {
    if (
      !Array.isArray(point) ||
      point.length < 2 ||
      !Number.isFinite(Number(point[0])) ||
      !Number.isFinite(Number(point[1]))
    ) {
      throw new Asset3dValidationError("Koordinat tapak bangunan tidak valid");
    }
  });
  return parsed;
};

const optionalDate = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const normalized = String(value).trim();
  const parsed = new Date(`${normalized}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(normalized) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== normalized
  ) {
    throw new Asset3dValidationError("Tanggal perekaman model 3D tidak valid");
  }
  return normalized;
};

export const normalizeAsset3dFields = (payload = {}, { partial = false } = {}) => {
  const result = {};
  const assign = (key, value) => {
    if (!partial || hasOwn(payload, key)) result[key] = value;
  };

  assign("building_footprint", validateFootprint(payload.building_footprint));
  assign(
    "building_height_m",
    optionalNumber(payload.building_height_m, "Tinggi bangunan", { min: 0.1, max: 1000 }),
  );
  assign(
    "building_base_elevation_m",
    optionalNumber(payload.building_base_elevation_m, "Elevasi dasar bangunan", {
      min: -500,
      max: 10000,
    }),
  );
  assign(
    "building_floors",
    optionalNumber(payload.building_floors, "Jumlah lantai", {
      min: 1,
      max: 300,
      integer: true,
    }),
  );
  assign(
    "building_height_source",
    optionalEnum(payload.building_height_source, "Sumber tinggi bangunan", ALLOWED_SOURCES),
  );
  assign(
    "building_height_quality",
    optionalEnum(payload.building_height_quality, "Kualitas tinggi bangunan", ALLOWED_QUALITIES),
  );
  assign(
    "model_3d_lod",
    optionalEnum(payload.model_3d_lod, "Level of Detail", ALLOWED_LODS, (value) =>
      value.toUpperCase(),
    ),
  );

  if (!partial || hasOwn(payload, "model_3d_source_crs")) {
    const crs = payload.model_3d_source_crs;
    if (crs === undefined) result.model_3d_source_crs = undefined;
    else if (crs === null || crs === "") result.model_3d_source_crs = null;
    else {
      const normalized = String(crs).trim().toUpperCase();
      if (!/^EPSG:\d{4,6}$/.test(normalized)) {
        throw new Asset3dValidationError(
          "CRS sumber harus berformat EPSG:xxxx, misalnya EPSG:32749",
        );
      }
      result.model_3d_source_crs = normalized;
    }
  }

  assign("model_3d_recorded_at", optionalDate(payload.model_3d_recorded_at));
  assign(
    "model_3d_accuracy_m",
    optionalNumber(payload.model_3d_accuracy_m, "Akurasi model 3D", {
      min: 0.001,
      max: 1000,
    }),
  );

  return Object.fromEntries(Object.entries(result).filter(([, value]) => value !== undefined));
};
