import express from "express";
import multer from "multer";
import * as OrthophotoController from "../controllers/orthophoto.controller.js";
import {
  authMiddleware,
  canViewAset,
  permissionMiddleware,
  PERMISSIONS,
} from "../middleware/auth.middleware.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 150 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const validExtension = /\.(tif|tiff)$/i.test(file.originalname || "");
    const validMime = [
      "image/tiff",
      "image/geotiff",
      "application/geotiff",
      "application/octet-stream",
    ].includes(file.mimetype);
    callback(
      validExtension && validMime ? null : new Error("File harus berformat GeoTIFF (.tif atau .tiff)"),
      validExtension && validMime,
    );
  },
});

const receiveUpload = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (!error) return next();
    const isLimit = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE";
    return res.status(isLimit ? 413 : 400).json({
      success: false,
      error: isLimit ? "Ukuran GeoTIFF maksimal 150 MB" : error.message,
    });
  });
};

router.get("/published", OrthophotoController.published);
router.use(authMiddleware);
router.get("/", canViewAset, OrthophotoController.list);
router.post(
  "/",
  permissionMiddleware(PERMISSIONS.ASET_UPDATE),
  receiveUpload,
  OrthophotoController.create,
);
router.put(
  "/:id",
  permissionMiddleware(PERMISSIONS.ASET_UPDATE),
  OrthophotoController.update,
);
router.patch(
  "/:id/publish",
  permissionMiddleware(PERMISSIONS.ASET_UPDATE),
  OrthophotoController.setPublished,
);
router.delete(
  "/:id",
  permissionMiddleware(PERMISSIONS.ASET_DELETE),
  OrthophotoController.remove,
);

export default router;
