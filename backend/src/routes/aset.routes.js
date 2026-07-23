import express from "express";
import multer from "multer";
import { AsetController, AssetModel3dController } from "../controllers/index.js";
import {
  authMiddleware,
  permissionMiddleware,
  PERMISSIONS,
  canViewAset,
} from "../middleware/auth.middleware.js";

const router = express.Router();
const model3dUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const allowedMimeTypes = new Set([
      "application/vnd.google-earth.kmz",
      "application/zip",
      "application/octet-stream",
      "model/gltf-binary",
    ]);
    const isSupported = /\.(kmz|glb)$/i.test(file.originalname || "");
    callback(isSupported && allowedMimeTypes.has(file.mimetype)
      ? null
      : new Error("File model harus berformat KMZ atau GLB"), isSupported);
  },
});

// All routes require authentication
router.use(authMiddleware);

// GET routes
router.get("/", canViewAset, AsetController.getAll);
router.get("/stats", canViewAset, AsetController.getStats);
router.get("/filter-options", canViewAset, AsetController.getFilterOptions);
router.get("/map", canViewAset, AsetController.getForMap);
router.get("/:id", canViewAset, AsetController.getById);
router.get("/:id/models-3d", canViewAset, AssetModel3dController.list);
router.get(
  "/:id/models-3d/:modelId/download",
  canViewAset,
  AssetModel3dController.download,
);

// POST routes
router.post(
  "/",
  permissionMiddleware(PERMISSIONS.ASET_CREATE),
  AsetController.create,
);
router.post(
  "/:id/models-3d",
  permissionMiddleware(PERMISSIONS.ASET_UPDATE),
  model3dUpload.single("file"),
  AssetModel3dController.upload,
);
router.post(
  "/:id/models-3d/:modelId/convert",
  permissionMiddleware(PERMISSIONS.ASET_UPDATE),
  AssetModel3dController.convert,
);

// PUT routes
router.put(
  "/:id",
  permissionMiddleware(PERMISSIONS.ASET_UPDATE),
  AsetController.update,
);
router.put(
  "/:id/models-3d/:modelId/activate",
  permissionMiddleware(PERMISSIONS.ASET_UPDATE),
  AssetModel3dController.activate,
);
router.put(
  "/:id/models-3d/:modelId/restore",
  permissionMiddleware(PERMISSIONS.ASET_UPDATE),
  AssetModel3dController.restore,
);
router.put(
  "/:id/models-3d/:modelId",
  permissionMiddleware(PERMISSIONS.ASET_UPDATE),
  AssetModel3dController.updateMetadata,
);
router.put(
  "/:id/models-3d/:modelId/rooms",
  permissionMiddleware(PERMISSIONS.ASET_UPDATE),
  AssetModel3dController.updateRooms,
);

// DELETE routes
router.delete(
  "/:id/models-3d/:modelId/permanent",
  permissionMiddleware(PERMISSIONS.ASET_DELETE),
  AssetModel3dController.removeArchived,
);
router.delete(
  "/:id/models-3d/:modelId",
  permissionMiddleware(PERMISSIONS.ASET_UPDATE),
  AssetModel3dController.archive,
);
router.delete(
  "/:id",
  permissionMiddleware(PERMISSIONS.ASET_DELETE),
  AsetController.remove,
);

export default router;
