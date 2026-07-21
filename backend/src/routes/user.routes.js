import express from "express";
import { UserController } from "../controllers/index.js";
import {
  authMiddleware,
  permissionMiddleware,
  PERMISSIONS,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// All routes require USER_MANAGE permission (admin only)
const adminOnly = permissionMiddleware(PERMISSIONS.USER_MANAGE);

// GET routes
router.get("/", adminOnly, UserController.getAll);
router.get("/stats", adminOnly, UserController.getStats);
router.get("/roles", adminOnly, UserController.getRoles);
router.get("/:id", adminOnly, UserController.getById);

// POST routes
router.post("/", adminOnly, UserController.create);

// PUT routes
router.put("/:id", adminOnly, UserController.update);
router.put("/:id/password", adminOnly, UserController.resetPassword);
router.put("/:id/toggle-status", adminOnly, UserController.toggleStatus);

// DELETE routes
router.delete("/:id", adminOnly, UserController.remove);

export default router;
