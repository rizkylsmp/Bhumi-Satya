import path from "node:path";

const IMAGE_TYPE_BY_EXTENSION = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/msword",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const ALLOWED_IMAGE_METADATA_TYPES = new Set([
  "application/octet-stream",
  "image/gif",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/x-webp",
]);

const startsWithBytes = (buffer, bytes) =>
  bytes.every((byte, index) => buffer[index] === byte);

export const detectImageContentType = (buffer) => {
  if (!Buffer.isBuffer(buffer)) return null;

  if (startsWithBytes(buffer, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47])) return "image/png";

  const header = buffer.subarray(0, 12).toString("ascii");
  if (header.startsWith("GIF87a") || header.startsWith("GIF89a")) {
    return "image/gif";
  }
  if (header.startsWith("RIFF") && header.slice(8, 12) === "WEBP") {
    return "image/webp";
  }

  return null;
};

export const isAllowedUploadMetadata = (file = {}) => {
  const extension = path.extname(file.originalname || "").toLowerCase();
  const mimeType = String(file.mimetype || "").toLowerCase();

  if (ALLOWED_DOCUMENT_TYPES.has(mimeType)) return true;
  return Boolean(IMAGE_TYPE_BY_EXTENSION[extension]) &&
    ALLOWED_IMAGE_METADATA_TYPES.has(mimeType);
};

export const resolveUploadContentType = (file = {}) => {
  const extension = path.extname(file.originalname || "").toLowerCase();
  const expectedImageType = IMAGE_TYPE_BY_EXTENSION[extension];

  if (!expectedImageType) return file.mimetype;

  const detectedImageType = detectImageContentType(file.buffer);
  if (!detectedImageType || detectedImageType !== expectedImageType) {
    const error = new Error(
      "Isi file gambar tidak sesuai. Gunakan JPG, JPEG, PNG, WebP, atau GIF yang valid",
    );
    error.status = 400;
    throw error;
  }

  return detectedImageType;
};
