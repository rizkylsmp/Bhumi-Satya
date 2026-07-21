import express from "express";
import { BackupController } from "../controllers/index.js";
import {
  authMiddleware,
  permissionMiddleware,
  PERMISSIONS,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// All routes require BACKUP_MANAGE permission (admin only)
const adminOnly = permissionMiddleware(PERMISSIONS.BACKUP_MANAGE);

// GET routes
router.get("/", adminOnly, BackupController.getAll);
router.get("/stats", adminOnly, BackupController.getStats);
router.get("/download/:filename", adminOnly, BackupController.download);

// POST routes
router.post("/export", adminOnly, BackupController.exportData);
router.post("/export-csv", adminOnly, BackupController.exportCsv);
router.post("/upload", adminOnly, BackupController.upload);
router.post("/import", adminOnly, BackupController.importData);

// DELETE routes
router.delete("/:filename", adminOnly, BackupController.remove);

export default router;
