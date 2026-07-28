export const MODEL3D_OBJECT_CATEGORIES = ["bangunan", "ruang", "unit", "komponen"];

export class Model3dObjectValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "Model3dObjectValidationError";
  }
}

const textValue = (value, label, maxLength, required = false) => {
  const text = String(value ?? "").trim();
  if (required && !text) throw new Model3dObjectValidationError(`${label} wajib diisi`);
  if (text.length > maxLength) {
    throw new Model3dObjectValidationError(`${label} maksimal ${maxLength} karakter`);
  }
  return text || null;
};

const numberValue = (value, label, maximum) => {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(String(value).replace(",", "."));
  if (!Number.isFinite(number) || number < 0 || number > maximum) {
    throw new Model3dObjectValidationError(`${label} tidak valid`);
  }
  return number;
};

export const normalizeModel3dObject = (input, { partial = false } = {}) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Model3dObjectValidationError("Data objek 3D tidak valid");
  }
  const output = {};
  const assign = (key, value) => {
    if (!partial || Object.hasOwn(input, key)) output[key] = value;
  };
  assign(
    "object_code",
    textValue(input.object_code, "Kode objek", 120, !partial)?.toUpperCase() || null,
  );
  assign("name", textValue(input.name ?? input.nama, "Nama objek", 200, !partial));
  if (!partial || Object.hasOwn(input, "category") || Object.hasOwn(input, "kategori")) {
    const category = String(input.category ?? input.kategori ?? "bangunan").trim().toLowerCase();
    if (!MODEL3D_OBJECT_CATEGORIES.includes(category)) {
      throw new Model3dObjectValidationError(`Kategori harus salah satu: ${MODEL3D_OBJECT_CATEGORIES.join(", ")}`);
    }
    output.category = category;
  }
  assign("floor", textValue(input.floor ?? input.lantai, "Lantai", 50));
  assign("usage", textValue(input.usage ?? input.penggunaan, "Penggunaan", 150));
  assign("area_m2", numberValue(input.area_m2 ?? input.luas_m2, "Luas", 100_000_000));
  assign("volume_m3", numberValue(input.volume_m3, "Volume", 1_000_000_000));
  assign("height_m", numberValue(input.height_m ?? input.tinggi_m, "Tinggi", 100_000));
  if (!partial || Object.hasOwn(input, "properties") || Object.hasOwn(input, "properties_json")) {
    let properties = input.properties ?? input.properties_json ?? {};
    if (typeof properties === "string") {
      try {
        properties = properties.trim() ? JSON.parse(properties) : {};
      } catch {
        throw new Model3dObjectValidationError("Properties JSON tidak valid");
      }
    }
    if (!properties || typeof properties !== "object" || Array.isArray(properties)) {
      throw new Model3dObjectValidationError("Properties harus berupa JSON object");
    }
    output.properties = properties;
  }
  return output;
};

export const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const source = String(text || "").replace(/^\uFEFF/, "");
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === "\"") {
      if (quoted && source[index + 1] === "\"") {
        field += "\"";
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (quoted) throw new Model3dObjectValidationError("CSV memiliki kutip yang tidak ditutup");
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  if (rows.length === 0) return [];
  const headers = rows[0].map((value) => value.trim().toLowerCase());
  return rows.slice(1).map((values) => Object.fromEntries(
    headers.map((header, index) => [header, values[index] ?? ""]),
  ));
};
