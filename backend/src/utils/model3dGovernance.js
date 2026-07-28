export class Model3dGovernanceValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "Model3dGovernanceValidationError";
  }
}

export const MODEL3D_REVIEW_STATUSES = Object.freeze([
  "draft",
  "processing",
  "needs_review",
  "verified",
  "rejected",
  "active",
  "expired",
]);

const EDITABLE_REVIEW_STATUSES = new Set([
  "draft",
  "needs_review",
  "verified",
  "rejected",
  "expired",
]);

export const normalizeModel3dReview = (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Model3dGovernanceValidationError("Data verifikasi model 3D tidak valid");
  }
  const reviewStatus = String(payload.review_status || "").trim().toLowerCase();
  if (!EDITABLE_REVIEW_STATUSES.has(reviewStatus)) {
    throw new Model3dGovernanceValidationError("Status verifikasi tidak dapat dipilih");
  }
  const notes = String(payload.review_notes || "").trim();
  if (notes.length > 2000) {
    throw new Model3dGovernanceValidationError("Catatan verifikasi maksimal 2000 karakter");
  }
  if (reviewStatus === "rejected" && !notes) {
    throw new Model3dGovernanceValidationError("Catatan wajib diisi ketika model ditolak");
  }
  return {
    review_status: reviewStatus,
    review_notes: notes || null,
  };
};
