import express from "express";
import { NotifikasiController } from "../controllers/index.js";
import {
  authMiddleware,
  permissionMiddleware,
  PERMISSIONS,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// All routes require NOTIFIKASI_VIEW permission
const canView = permissionMiddleware(PERMISSIONS.NOTIFIKASI_VIEW);

// GET routes
router.get("/", canView, NotifikasiController.getAll);
router.get("/unread-count", canView, NotifikasiController.getUnreadCount);
router.get("/recent", canView, NotifikasiController.getRecent);

// PUT routes
router.put("/read-all", canView, NotifikasiController.markAllAsRead);
router.put("/:id/read", canView, NotifikasiController.markAsRead);

// DELETE routes (clear-all must come before :id to avoid route conflict)
router.delete("/clear-all", canView, NotifikasiController.clearAll);
router.delete("/:id", canView, NotifikasiController.remove);

export default router;
