import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createKode3dBase,
  createKode3dCandidate,
} from "./asset3dCatalog.js";

describe("asset3dCatalog", () => {
  it("membuat kode 3D stabil dari kode bangunan", () => {
    assert.equal(createKode3dBase(" BPKA/01.02 "), "3D-BPKA-01-02");
  });

  it("menambahkan urutan untuk menangani benturan kode", () => {
    assert.equal(createKode3dCandidate("AST-001", 2), "3D-AST-001-2");
  });

  it("membuat kode default ringkas dari primary key aset", () => {
    assert.equal(createKode3dCandidate("KODE-ASET-YANG-SANGAT-PANJANG", 1, 123), "3D-000123");
  });

  it("menolak kode bangunan kosong", () => {
    assert.throws(() => createKode3dBase(""), /Kode bangunan diperlukan/);
  });
});
