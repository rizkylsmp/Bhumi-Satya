import { Router } from "express";
import { AsetController } from "../controllers/index.js";
import {
  authMiddleware,
  permissionMiddleware,
  PERMISSIONS,
} from "../middleware/auth.middleware.js";
import {
  adaptJsonResponse,
  adaptLegacyDetailPayload,
  adaptLegacyListPayload,
  adaptLegacyStatsPayload,
  deprecationHeaders,
  normalizeLegacyQuery,
  rejectLegacyMutation,
} from "../adapters/pusatData.adapter.js";

const router = Router();

// All routes require authentication
router.use(authMiddleware);
router.use(deprecationHeaders);

const canRead = permissionMiddleware(PERMISSIONS.ASET_READ);
const canCreate = permissionMiddleware(PERMISSIONS.ASET_CREATE);
const canUpdate = permissionMiddleware(PERMISSIONS.ASET_UPDATE);
const canDelete = permissionMiddleware(PERMISSIONS.ASET_DELETE);

// Stats - all roles can view
router.get(
  "/stats",
  canRead,
  adaptJsonResponse(adaptLegacyStatsPayload),
  AsetController.getStats,
);

// Read - all roles can view
router.get(
  "/",
  canRead,
  normalizeLegacyQuery,
  adaptJsonResponse(adaptLegacyListPayload),
  AsetController.getAll,
);
router.get(
  "/:id",
  canRead,
  adaptJsonResponse(adaptLegacyDetailPayload),
  AsetController.getById,
);
router.post(
  "/",
  canCreate,
  rejectLegacyMutation,
);
router.put(
  "/:id",
  canUpdate,
  rejectLegacyMutation,
);
router.delete(
  "/:id",
  canDelete,
  rejectLegacyMutation,
);

export default router;
