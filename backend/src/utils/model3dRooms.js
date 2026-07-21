import crypto from "node:crypto";

export class Model3dRoomValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "Model3dRoomValidationError";
  }
}

const cleanText = (value, label, maxLength, { required = false } = {}) => {
  const normalized = String(value ?? "").trim();
  if (required && !normalized) throw new Model3dRoomValidationError(`${label} wajib diisi`);
  if (normalized.length > maxLength) {
    throw new Model3dRoomValidationError(`${label} maksimal ${maxLength} karakter`);
  }
  return normalized || null;
};

export const normalizeModel3dRooms = (rooms) => {
  if (!Array.isArray(rooms)) throw new Model3dRoomValidationError("Daftar ruang harus berupa array");
  if (rooms.length > 500) throw new Model3dRoomValidationError("Daftar ruang maksimal 500 item");

  return rooms.map((room, index) => {
    if (!room || typeof room !== "object" || Array.isArray(room)) {
      throw new Model3dRoomValidationError(`Data ruang ke-${index + 1} tidak valid`);
    }

    const rawArea = room.area_m2 ?? room.area ?? room.luas;
    const area = rawArea === null || rawArea === undefined || rawArea === ""
      ? null
      : Number(rawArea);
    if (area !== null && (!Number.isFinite(area) || area < 0 || area > 10000000)) {
      throw new Model3dRoomValidationError(`Luas ruang ke-${index + 1} tidak valid`);
    }

    return {
      id: cleanText(room.id, "ID ruang", 100) || crypto.randomUUID(),
      name: cleanText(room.name ?? room.nama, "Nama ruang", 150, { required: true }),
      floor: cleanText(room.floor ?? room.lantai, "Lantai", 50),
      area_m2: area,
      usage: cleanText(room.usage ?? room.penggunaan, "Penggunaan", 120),
      unit_code: cleanText(room.unit_code ?? room.kode_unit, "Kode unit", 100),
      notes: cleanText(room.notes ?? room.catatan, "Catatan", 500),
    };
  });
};
