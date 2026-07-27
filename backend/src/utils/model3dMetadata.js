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
  ];

  textFields.forEach(([key, label, maxLength]) => {
    if (hasOwn(metadata, key)) normalized[key] = cleanText(metadata[key], label, maxLength);
  });
  numberFields.forEach(([key, label, min, max]) => {
    if (hasOwn(metadata, key)) normalized[key] = cleanNumber(metadata[key], label, min, max);
  });

  if (Object.keys(normalized).length === 0) {
    throw new Model3dMetadataValidationError("Tidak ada metadata model 3D yang diperbarui");
  }

  return normalized;
};
