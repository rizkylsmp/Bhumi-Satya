import express from "express";
import {
  authMiddleware,
  permissionMiddleware,
  PERMISSIONS,
} from "../middleware/auth.middleware.js";
import * as PermintaanController from "../controllers/permintaan.controller.js";

const router = express.Router();

// Public route - submit request (no auth)
router.post("/submit", PermintaanController.submitRequest);

// Authenticated routes
router.use(authMiddleware);

const canView = permissionMiddleware(PERMISSIONS.ASET_READ);
const canViewApproved = permissionMiddleware(PERMISSIONS.SEWA_APPROVED_VIEW);
const canUpdate = permissionMiddleware(PERMISSIONS.ASET_UPDATE);
const canDelete = permissionMiddleware(PERMISSIONS.ASET_DELETE);

router.get("/masyarakat", canViewApproved, PermintaanController.getForMasyarakat);
router.post(
  "/masyarakat/submit",
  canViewApproved,
  PermintaanController.submitForMasyarakat,
);
router.get("/", canView, PermintaanController.getAll);
router.put("/:id", canUpdate, PermintaanController.update);
router.put("/:id/status", canUpdate, PermintaanController.updateStatus);
router.delete("/:id", canDelete, PermintaanController.remove);

export default router;
