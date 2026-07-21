import express from "express";
import { AuthController } from "../controllers/index.js";
import { authMiddleware, expiredTokenMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/login", AuthController.login);
router.post("/register", AuthController.register);
router.post("/otp/verify", AuthController.verifyLoginOtp);
router.post("/mfa/verify", AuthController.verifyMfaLogin);
router.post("/mfa/email-otp", AuthController.requestMfaEmailOtp);
router.post("/forgot-password/request", AuthController.requestPasswordReset);
router.post("/forgot-password/reset", AuthController.resetPasswordWithOtp);

// Protected routes
router.get("/me", authMiddleware, AuthController.getCurrentUser);
router.put("/profile", authMiddleware, AuthController.updateProfile);
router.put("/change-password", authMiddleware, AuthController.changePassword);
router.post("/refresh-token", expiredTokenMiddleware, AuthController.refreshToken);
router.post("/logout", authMiddleware, AuthController.logout);

// MFA routes (protected)
router.post("/mfa/setup", authMiddleware, AuthController.setupMfa);
router.post("/mfa/verify-setup", authMiddleware, AuthController.verifyMfaSetup);
router.post("/mfa/disable", authMiddleware, AuthController.disableMfa);

export default router;
