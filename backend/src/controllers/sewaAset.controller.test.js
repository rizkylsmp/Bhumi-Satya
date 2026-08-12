import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRentalCategory } from "./sewaAset.controller.js";

test("normalizes supported rental categories", () => {
  assert.equal(normalizeRentalCategory("Tanah"), "Tanah");
  assert.equal(normalizeRentalCategory("Bangunan"), "Bangunan");
});

test("uses a safe category for legacy and invalid rental data", () => {
  assert.equal(normalizeRentalCategory(undefined), "Tanah");
  assert.equal(normalizeRentalCategory("Gedung"), "Tanah");
  assert.equal(normalizeRentalCategory(undefined, "Bangunan"), "Bangunan");
});
