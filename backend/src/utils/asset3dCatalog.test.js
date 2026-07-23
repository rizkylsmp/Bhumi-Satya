import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createKode3dBase,
  createKode3dCandidate,
} from "./asset3dCatalog.js";

describe("asset3dCatalog", () => {
  it("membuat kode 3D stabil dari kode aset", () => {
    assert.equal(createKode3dBase(" BPKA/01.02 "), "3D-BPKA-01-02");
  });

  it("menambahkan urutan untuk menangani benturan kode", () => {
    assert.equal(createKode3dCandidate("AST-001", 2), "3D-AST-001-2");
  });

  it("menolak kode aset kosong", () => {
    assert.throws(() => createKode3dBase(""), /Kode aset diperlukan/);
  });
});
