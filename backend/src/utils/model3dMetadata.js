export class Model3dMetadataValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "Model3dMetadataValidationError";
  }
}

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

const cleanText = (value, label, maxLength) => {
  const normalized = String(value ?? "").trim();
  if (normalized.length > maxLength) {
    throw new Model3dMetadataValidationError(`${label} maksimal ${maxLength} karakter`);
  }
  return normalized || null;
};

const cleanNumber = (value, label, min, max) => {
  if (value === null || value === undefined || value === "") return null;
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized < min || normalized > max) {
    throw new Model3dMetadataValidationError(`${label} harus antara ${min} dan ${max}`);
  }
  return normalized;
};

const SOURCE_DATA_TYPES = new Set([
  "lidar",
  "photogrammetry",
  "building_outline",
  "bim",
  "manual",
  "other",
]);
const SOURCE_UNITS = new Set(["m", "cm", "mm"]);
const QUALITY_CHECK_KEYS = [
  "source_documented",
  "crs_confirmed",
  "origin_confirmed",
  "unit_confirmed",
  "geometry_checked",
  "attributes_matched",
];

export const normalizeModel3dMetadata = (metadata) => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new Model3dMetadataValidationError("Metadata model 3D tidak valid");
  }

  const normalized = {};
  const textFields = [
    ["display_name", "Nama model", 150],
    ["description", "Deskripsi model", 1000],
  ];
  const numberFields = [
    ["location_lat", "Latitude", -90, 90],
    ["location_long", "Longitude", -180, 180],
    ["altitude_m", "Ketinggian", -10000, 100000],
    ["heading", "Heading", -360, 360],
    ["tilt", "Tilt", -180, 180],
    ["roll", "Roll", -360, 360],
    ["scale_x", "Skala X", 0.000001, 10000],
    ["scale_y", "Skala Y", 0.000001, 10000],
    ["scale_z", "Skala Z", 0.000001, 10000],
    ["offset_x_m", "Offset X", -100000, 100000],
    ["offset_y_m", "Offset Y", -100000, 100000],
    ["offset_z_m", "Offset Z", -10000, 100000],
    ["source_origin_x", "Origin X", -1000000000, 1000000000],
    ["source_origin_y", "Origin Y", -1000000000, 1000000000],
    ["source_origin_z", "Origin Z", -1000000, 1000000],
  ];

  textFields.forEach(([key, label, maxLength]) => {
    if (hasOwn(metadata, key)) normalized[key] = cleanText(metadata[key], label, maxLength);
  });
  numberFields.forEach(([key, label, min, max]) => {
    if (hasOwn(metadata, key)) normalized[key] = cleanNumber(metadata[key], label, min, max);
  });

  if (hasOwn(metadata, "source_data_type")) {
    const value = cleanText(metadata.source_data_type, "Jenis data sumber", 32);
    if (value && !SOURCE_DATA_TYPES.has(value)) {
      throw new Model3dMetadataValidationError("Jenis data sumber tidak didukung");
    }
    normalized.source_data_type = value;
  }
  if (hasOwn(metadata, "source_unit")) {
    const value = cleanText(metadata.source_unit, "Satuan sumber", 12);
    if (value && !SOURCE_UNITS.has(value)) {
      throw new Model3dMetadataValidationError("Satuan sumber harus m, cm, atau mm");
    }
    normalized.source_unit = value;
  }
  if (hasOwn(metadata, "source_crs")) {
    const value = cleanText(metadata.source_crs, "CRS sumber", 32)?.toUpperCase() || null;
    if (value && !/^EPSG:\d{4,6}$/.test(value)) {
      throw new Model3dMetadataValidationError("CRS sumber harus berformat EPSG:xxxx");
    }
    normalized.source_crs = value;
  }
  if (hasOwn(metadata, "expires_at")) {
    if (metadata.expires_at === null || metadata.expires_at === "") {
      normalized.expires_at = null;
    } else {
      const value = new Date(metadata.expires_at);
      if (Number.isNaN(value.getTime())) {
        throw new Model3dMetadataValidationError("Tanggal kedaluwarsa tidak valid");
      }
      normalized.expires_at = value;
    }
  }
  if (hasOwn(metadata, "quality_checklist")) {
    if (
      !metadata.quality_checklist
      || typeof metadata.quality_checklist !== "object"
      || Array.isArray(metadata.quality_checklist)
    ) {
      throw new Model3dMetadataValidationError("Checklist kualitas tidak valid");
    }
    normalized.quality_checklist = Object.fromEntries(
      QUALITY_CHECK_KEYS.map((key) => [key, metadata.quality_checklist[key] === true]),
    );
  }

  if (Object.keys(normalized).length === 0) {
    throw new Model3dMetadataValidationError("Tidak ada metadata model 3D yang diperbarui");
  }

  return normalized;
};
