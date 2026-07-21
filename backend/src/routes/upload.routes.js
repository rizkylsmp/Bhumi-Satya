import express from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { uploadToSupabase, deleteFromSupabase } from "../utils/r2Storage.js";

const router = express.Router();

// Configure multer for memory storage (no disk writes — serverless compatible)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipe file tidak diizinkan"), false);
    }
  },
});

router.use(authMiddleware);

// Upload single file (foto aset, foto profil)
router.post("/single", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "File diperlukan" });
    }

    const folder = req.body.folder || "uploads";
    const timestamp = Date.now();
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${folder}/${timestamp}_${safeName}`;

    const url = await uploadToSupabase(
      filename,
      req.file.buffer,
      req.file.mimetype,
    );

    res.json({
      success: true,
      data: { url, filename, originalName: req.file.originalname },
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload multiple files (dokumen pendukung)
router.post("/multiple", upload.array("files", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: "File diperlukan" });
    }

    const folder = req.body.folder || "uploads";
    const results = [];

    for (const file of req.files) {
      const timestamp = Date.now();
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filename = `${folder}/${timestamp}_${safeName}`;

      const url = await uploadToSupabase(filename, file.buffer, file.mimetype);
      results.push({ url, filename, originalName: file.originalname });
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Error uploading files:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

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
