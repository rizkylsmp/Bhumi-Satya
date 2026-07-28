import assert from "node:assert/strict";
import test from "node:test";
import {
  Model3dGovernanceValidationError,
  normalizeModel3dReview,
} from "./model3dGovernance.js";

test("normalizes an editable model review", () => {
  assert.deepEqual(normalizeModel3dReview({
    review_status: " VERIFIED ",
    review_notes: "Posisi dan geometri sesuai",
  }), {
    review_status: "verified",
    review_notes: "Posisi dan geometri sesuai",
  });
});

test("requires notes when a model is rejected", () => {
  assert.throws(
    () => normalizeModel3dReview({ review_status: "rejected" }),
    Model3dGovernanceValidationError,
  );
});

test("prevents system-only status changes", () => {
  assert.throws(
    () => normalizeModel3dReview({ review_status: "active" }),
    /tidak dapat dipilih/,
  );
});
