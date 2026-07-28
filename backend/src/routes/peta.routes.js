import express from "express";
import { PetaController } from "../controllers/index.js";
import {
  authMiddleware,
  permissionMiddleware,
  PERMISSIONS,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/public-markers", PetaController.getPublicMarkers);
router.get("/public-detail/:id", PetaController.getDetail);

// All routes below require authentication
router.use(authMiddleware);

// Permission middlewares
const canView = permissionMiddleware(PERMISSIONS.PETA_VIEW);
const canLayerUmum = permissionMiddleware(PERMISSIONS.LAYER_UMUM);
const canLayerTataRuang = permissionMiddleware(PERMISSIONS.LAYER_TATA_RUANG);
const canLayerPotensiBerperkara = permissionMiddleware(
  PERMISSIONS.LAYER_POTENSI_BERPERKARA
);
const canLayerSebaranPerkara = permissionMiddleware(
  PERMISSIONS.LAYER_SEBARAN_PERKARA
);

// General routes
router.get("/layers", PetaController.getLayers);
router.get("/markers", canView, PetaController.getMarkers);
router.get("/models-3d/tileset.json", canView, PetaController.getModel3dTileset);
router.get("/stats", canView, PetaController.getStats);
router.get("/search", canView, PetaController.search);
router.get("/detail/:id", canView, PetaController.getDetail);

// Layer-specific routes
router.get("/layer/umum", canLayerUmum, PetaController.getLayerUmum);
router.get(
  "/layer/tata-ruang",
  canLayerTataRuang,
  PetaController.getLayerTataRuang
);
router.get(
  "/layer/potensi-berperkara",
  canLayerPotensiBerperkara,
  PetaController.getLayerPotensiBerperkara
);
router.get(
  "/layer/sebaran-perkara",
  canLayerSebaranPerkara,
  PetaController.getLayerSebaranPerkara
);

export default router;
