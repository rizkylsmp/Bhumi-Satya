import express from "express";
import { RiwayatController } from "../controllers/index.js";
import {
  authMiddleware,
  permissionMiddleware,
  PERMISSIONS,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Most routes require RIWAYAT_VIEW permission
const canView = permissionMiddleware(PERMISSIONS.RIWAYAT_VIEW);
const adminOnly = permissionMiddleware(PERMISSIONS.USER_MANAGE);

// GET routes
router.get("/", canView, RiwayatController.getAll);
router.get("/stats", canView, RiwayatController.getStats);
router.get("/aset/:asetId", canView, RiwayatController.getByAset);
router.get("/user/:userId", adminOnly, RiwayatController.getByUser);
router.get("/:id", canView, RiwayatController.getById);

export default router;
