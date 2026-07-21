import express from "express";
import * as EkasmatController from "../controllers/ekasmat.controller.js";
import { authMiddleware, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", EkasmatController.getAll);
router.post("/submit", EkasmatController.submit);

// Protected routes - Admin only
router.put("/:id", authMiddleware, adminOnly, EkasmatController.updateById);
router.delete("/:id", authMiddleware, adminOnly, EkasmatController.deleteById);

export default router;
