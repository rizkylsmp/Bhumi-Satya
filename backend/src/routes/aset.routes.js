import express from "express";
import multer from "multer";
import {
  AsetController,
  AssetModel3dController,
  Model3dObjectController,
} from "../controllers/index.js";
import {
  authMiddleware,
  permissionMiddleware,
  PERMISSIONS,
  canViewAset,
} from "../middleware/auth.middleware.js";
import { ensureAset3dCatalogSchemaMiddleware } from "../services/aset3dSchema.service.js";

const router = express.Router();
const model3dUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const allowedMimeTypes = new Set([
      "application/vnd.google-earth.kmz",
      "application/zip",
      "application/x-zip-compressed",
      "application/octet-stream",
      "model/gltf-binary",
    ]);
    const isSupported = /\.(kmz|glb|zip)$/i.test(file.originalname || "");
    callback(isSupported && allowedMimeTypes.has(file.mimetype)
      ? null
      : new Error("File model harus berformat KMZ, GLB, atau ZIP 3D Tiles"), isSupported);
  },
});
const receiveModel3dUpload = (req, res, next) => {
  model3dUpload.single("file")(req, res, (error) => {
    if (!error) return next();
    const isSizeLimit = error instanceof multer.MulterError
      && error.code === "LIMIT_FILE_SIZE";
    return res.status(isSizeLimit ? 413 : 400).json({
      success: false,
      error: isSizeLimit
        ? "Ukuran model maksimal 100 MB"
        : error.message,
    });
  });
};
const objectCsvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const valid = /\.csv$/i.test(file.originalname || "")
      && [
        "text/csv",
        "application/csv",
        "application/vnd.ms-excel",
        "application/octet-stream",
        "text/plain",
      ]
        .includes(file.mimetype);
    callback(valid ? null : new Error("File harus berformat CSV"), valid);
  },
});
const receiveObjectCsv = (req, res, next) => {
  objectCsvUpload.single("file")(req, res, (error) => {
    if (!error) return next();
    return res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({
      success: false,
      error: error.code === "LIMIT_FILE_SIZE" ? "Ukuran CSV maksimal 2 MB" : error.message,
    });
  });
};

// All routes require authentication
router.use(authMiddleware);
router.use(
  "/:id/models-3d",
  ensureAset3dCatalogSchemaMiddleware,
);

// GET routes
router.get("/", canViewAset, AsetController.getAll);
router.get("/stats", canViewAset, AsetController.getStats);
router.get("/filter-options", canViewAset, AsetController.getFilterOptions);
router.get("/map", canViewAset, AsetController.getForMap);
router.get("/:id", canViewAset, AsetController.getById);
router.get("/:id/models-3d", canViewAset, AssetModel3dController.list);
router.get(
  "/:id/models-3d/:modelId/objects/template",
  canViewAset,
  Model3dObjectController.downloadTemplate,
);
router.get(
  "/:id/models-3d/:modelId/objects",
  canViewAset,
  Model3dObjectController.list,
);
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
  receiveModel3dUpload,
  AssetModel3dController.upload,
);
router.post(
  "/:id/models-3d/:modelId/convert",
  permissionMiddleware(PERMISSIONS.ASET_UPDATE),
  AssetModel3dController.convert,
);
router.post(
  "/:id/models-3d/:modelId/objects",
  permissionMiddleware(PERMISSIONS.ASET_UPDATE),
  Model3dObjectController.create,
);
router.post(
  "/:id/models-3d/:modelId/objects/import",
  permissionMiddleware(PERMISSIONS.ASET_UPDATE),
  receiveObjectCsv,
  Model3dObjectController.importCsv,
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
  "/:id/models-3d/:modelId/review",
  permissionMiddleware(PERMISSIONS.ASET_UPDATE),
  AssetModel3dController.review,
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
router.put(
  "/:id/models-3d/:modelId/objects/:objectId",
  permissionMiddleware(PERMISSIONS.ASET_UPDATE),
  Model3dObjectController.update,
);

// DELETE routes
router.delete(
  "/:id/models-3d/:modelId/permanent",
  permissionMiddleware(PERMISSIONS.ASET_DELETE),
  AssetModel3dController.removeArchived,
);
router.delete(
  "/:id/models-3d/:modelId/objects/:objectId",
  permissionMiddleware(PERMISSIONS.ASET_UPDATE),
  Model3dObjectController.remove,
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
