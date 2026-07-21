import express from "express";
import {
  authMiddleware,
  permissionMiddleware,
  PERMISSIONS,
} from "../middleware/auth.middleware.js";
import * as SewaAsetController from "../controllers/sewaAset.controller.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/public-available", SewaAsetController.getPublicAvailable);

// All routes below require authentication
router.use(authMiddleware);

// Convenience: anyone who can read aset can read sewa
const canView = permissionMiddleware(PERMISSIONS.ASET_READ);
const canViewApproved = permissionMiddleware(PERMISSIONS.SEWA_APPROVED_VIEW);
const canCreate = permissionMiddleware(PERMISSIONS.ASET_CREATE);
const canUpdate = permissionMiddleware(PERMISSIONS.ASET_UPDATE);
const canDelete = permissionMiddleware(PERMISSIONS.ASET_DELETE);

// Read
router.get(
  "/masyarakat/tersedia",
  canViewApproved,
  SewaAsetController.getAvailableForMasyarakat,
);
router.get(
  "/masyarakat/disetujui",
  canViewApproved,
  SewaAsetController.getApprovedForMasyarakat,
);
router.get("/", canView, SewaAsetController.getAll);
router.get("/stats", canView, SewaAsetController.getStats);
router.get("/pengembalian", canView, SewaAsetController.getPengembalian);
router.get("/:id", canView, SewaAsetController.getById);

// Create / Update / Delete
router.post("/", canCreate, SewaAsetController.create);
router.put("/:id", canUpdate, SewaAsetController.update);
router.put(
  "/:id/pengembalian",
  canUpdate,
  SewaAsetController.prosesPengembalian,
);
router.delete("/:id", canDelete, SewaAsetController.remove);

export default router;
