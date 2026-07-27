import express from "express";
import { Aset3dCatalogController } from "../controllers/index.js";
import {
  authMiddleware,
  canViewAset,
  permissionMiddleware,
  PERMISSIONS,
} from "../middleware/auth.middleware.js";
import { ensureAset3dCatalogSchemaMiddleware } from "../services/aset3dSchema.service.js";

const router = express.Router();

router.use(authMiddleware);
router.use(ensureAset3dCatalogSchemaMiddleware);
router.get("/", canViewAset, Aset3dCatalogController.list);
router.get("/candidates", canViewAset, Aset3dCatalogController.candidates);
router.get("/:kode3d", canViewAset, Aset3dCatalogController.getByCode);
router.post(
  "/",
  permissionMiddleware(PERMISSIONS.ASET_UPDATE),
  Aset3dCatalogController.create,
);
router.delete(
  "/:kode3d",
  permissionMiddleware(PERMISSIONS.ASET_UPDATE),
  Aset3dCatalogController.remove,
);

export default router;
