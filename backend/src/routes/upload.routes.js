import express from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { uploadToSupabase, deleteFromSupabase } from "../utils/r2Storage.js";
import {
  isAllowedUploadMetadata,
  resolveUploadContentType,
} from "../utils/uploadFileValidation.js";

const router = express.Router();

// Configure multer for memory storage (no disk writes — serverless compatible)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (isAllowedUploadMetadata(file)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Tipe file tidak diizinkan. Gunakan JPG, JPEG, PNG, WebP, GIF, PDF, DOC, atau DOCX",
        ),
        false,
      );
    }
  },
});

const receiveUpload = (middleware) => (req, res, next) => {
  middleware(req, res, (error) => {
    if (!error) return next();

    const isSizeLimit =
      error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE";

    return res.status(isSizeLimit ? 413 : 400).json({
      success: false,
      error: isSizeLimit ? "Ukuran file maksimal 10 MB" : error.message,
    });
  });
};

router.use(authMiddleware);

// Upload single file (foto aset, foto profil)
router.post(
  "/single",
  receiveUpload(upload.single("file")),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, error: "File diperlukan" });
      }

      const folder = req.body.folder || "uploads";
      const timestamp = Date.now();
      const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filename = `${folder}/${timestamp}_${safeName}`;
      const contentType = resolveUploadContentType(req.file);

      const url = await uploadToSupabase(
        filename,
        req.file.buffer,
        contentType,
      );

      res.json({
        success: true,
        data: { url, filename, originalName: req.file.originalname },
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res
        .status(error.status || 500)
        .json({ success: false, error: error.message });
    }
  },
);

// Upload multiple files (dokumen pendukung)
router.post(
  "/multiple",
  receiveUpload(upload.array("files", 5)),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res
          .status(400)
          .json({ success: false, error: "File diperlukan" });
      }

      const folder = req.body.folder || "uploads";
      const results = [];

      for (const file of req.files) {
        const timestamp = Date.now();
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filename = `${folder}/${timestamp}_${safeName}`;
        const contentType = resolveUploadContentType(file);

        const url = await uploadToSupabase(filename, file.buffer, contentType);
        results.push({ url, filename, originalName: file.originalname });
      }

      res.json({ success: true, data: results });
    } catch (error) {
      console.error("Error uploading files:", error);
      res
        .status(error.status || 500)
        .json({ success: false, error: error.message });
    }
  },
);

// Delete file
router.delete("/", async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res
        .status(400)
        .json({ success: false, error: "Filename diperlukan" });
    }

    await deleteFromSupabase(filename);
    res.json({ success: true, message: "File berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
