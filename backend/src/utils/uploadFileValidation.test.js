import assert from "node:assert/strict";
import test from "node:test";
import {
  detectImageContentType,
  isAllowedUploadMetadata,
  resolveUploadContentType,
} from "./uploadFileValidation.js";

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xdb]);
const webp = Buffer.concat([
  Buffer.from("RIFF", "ascii"),
  Buffer.alloc(4),
  Buffer.from("WEBP", "ascii"),
]);

test("mendeteksi signature JPG dan WebP", () => {
  assert.equal(detectImageContentType(jpeg), "image/jpeg");
  assert.equal(detectImageContentType(webp), "image/webp");
});

test("menerima variasi MIME JPG dan WebP dari perangkat", () => {
  assert.equal(
    isAllowedUploadMetadata({
      originalname: "kondisi.jpg",
      mimetype: "image/jpg",
    }),
    true,
  );
  assert.equal(
    isAllowedUploadMetadata({
      originalname: "kondisi.webp",
      mimetype: "application/octet-stream",
    }),
    true,
  );
});

test("menormalisasi MIME berdasarkan signature file", () => {
  assert.equal(
    resolveUploadContentType({
      originalname: "kondisi.jpg",
      mimetype: "image/jpg",
      buffer: jpeg,
    }),
    "image/jpeg",
  );
  assert.equal(
    resolveUploadContentType({
      originalname: "kondisi.webp",
      mimetype: "image/x-webp",
      buffer: webp,
    }),
    "image/webp",
  );
});

test("menolak ekstensi gambar dengan isi yang tidak cocok", () => {
  assert.throws(
    () =>
      resolveUploadContentType({
        originalname: "bukan-gambar.webp",
        mimetype: "image/webp",
        buffer: jpeg,
      }),
    /Isi file gambar tidak sesuai/,
  );
});
