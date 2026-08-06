import express from "express";
import { Aset2dCatalogController } from "../controllers/index.js";
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
router.get("/", canViewAset, Aset2dCatalogController.list);
router.get("/stats", canViewAset, Aset2dCatalogController.stats);
router.get("/candidates", canViewAset, Aset2dCatalogController.candidates);
router.post(
  "/",
  permissionMiddleware(PERMISSIONS.ASET_UPDATE),
  Aset2dCatalogController.create,
);
router.delete(
  "/:kode2d",
  permissionMiddleware(PERMISSIONS.ASET_UPDATE),
  Aset2dCatalogController.remove,
);

export default router;
