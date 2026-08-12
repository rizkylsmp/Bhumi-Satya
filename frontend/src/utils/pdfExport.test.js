import { describe, expect, it } from "vitest";
import {
  buildBuildingPdfDocument,
  buildLandPdfDocument,
  buildPdf,
  getPdfBuildingIdentity,
} from "./pdfExport";

describe("PDF export template", () => {
  it("builds a valid A4 PDF with the Bhumi Satya data-sheet sections", () => {
    const pdf = buildPdf({
      title: "Laporan Data Bangunan",
      subtitle: "Gedung Pelayanan - 3D-001",
      sections: [
        {
          heading: "Identitas Bangunan",
          rows: [
            ["ID Primary Key", 7],
            ["Kode Bangunan", "3D-001"],
            ["Nama Bangunan", "Gedung Pelayanan"],
          ],
        },
      ],
    });

    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf).toContain("BHUMI SATYA");
    expect(pdf).toContain("LAPORAN DATA BANGUNAN");
    expect(pdf).toContain("IDENTITAS BANGUNAN");
    expect(pdf).toContain("/MediaBox [0 0 595.28 841.89]");
    expect(pdf.endsWith("%%EOF")).toBe(true);
  });

  it("uses the renamed building identity and falls back to 3D fields", () => {
    expect(getPdfBuildingIdentity({
      id_aset: 7,
      kode_3d: "3D-001",
      building_name_3d: "Gedung Pelayanan",
      kode_aset: "AST-001",
      nama_aset: "Aset Lama",
    })).toEqual({
      id: 7,
      code: "AST-001",
      name: "Aset Lama",
    });

    expect(getPdfBuildingIdentity({
      id: 8,
      kode_aset: "AST-002",
      nama_aset: "Bangunan Lama",
    })).toEqual({
      id: 8,
      code: "AST-002",
      name: "Bangunan Lama",
    });
  });

  it("embeds available documentation images and preserves empty media slots", () => {
    const pdf = buildPdf({
      title: "Laporan Data Aset",
      subtitle: "AST-002",
      sections: [],
      media: [
        {
          label: "Foto Kondisi Eksisting",
          image: { data: "mock-jpeg", width: 720, height: 420 },
        },
        {
          label: "Sketsa Lokasi",
          image: null,
          emptyText: "Koordinat belum tersedia",
        },
      ],
    });

    expect(pdf).toContain("FOTO DAN SKETSA");
    expect(pdf).toContain("/Subtype /Image");
    expect(pdf).toContain("/Im1");
    expect(pdf).toContain("Koordinat belum tersedia");
  });

  it("embeds the Bhumi Satya logo in the document header", () => {
    const pdf = buildPdf({
      title: "Laporan Data Aset",
      subtitle: "AST-003",
      sections: [],
      brandLogo: { data: "mock-logo-jpeg", width: 256, height: 256 },
    });

    expect(pdf).toContain("/BrandLogo");
    expect(pdf).not.toContain("(BS)");
  });

  it("builds a building catalog document from 3D and linked land data", () => {
    const document = buildBuildingPdfDocument({
      kode_3d: "3D-000007",
      kode_2d: "2D-000004",
      building_name: "Gedung Pelayanan",
      status: "active",
      model_status: "needs_review",
      model_count: 2,
      center_x: 112.907,
      center_y: -7.645,
      active_model: {
        lod: "LOD2",
        version: 3,
        format: "GLB",
        original_name: "gedung.glb",
      },
      asset: {
        id_aset: 17,
        kode_aset: "TNH-001",
        nama_aset: "Kompleks Pelayanan",
        lokasi: "Area Operasional",
        building_height_m: 12,
      },
    });

    expect(document.subtitle).toBe("Gedung Pelayanan - 3D-000007");
    expect(document.coordinates).toEqual({ latitude: -7.645, longitude: 112.907 });
    expect(document.sections[0].rows).toContainEqual(["ID Primary Key", 17]);
    expect(document.sections[0].rows).toContainEqual(["Kode Bangunan", "3D-000007"]);
    expect(document.sections[1].rows).toContainEqual(["Status Model", "Needs Review"]);
  });

  it("uses land identity labels for the Pusat Data Tanah PDF", () => {
    const document = buildLandPdfDocument({
      id_aset: 21,
      kode_aset: "TNH-000021",
      nama_aset: "Tanah Kompleks Pelayanan",
      koordinat_lat: -7.645,
      koordinat_long: 112.907,
    });

    expect(document.title).toBe("Laporan Data Tanah");
    expect(document.subtitle).toBe("Tanah Kompleks Pelayanan");
    expect(document.filenameKey).toBe("TNH-000021");
    expect(document.sections[0].heading).toBe("Identitas Tanah");
    expect(document.sections[0].rows).toContainEqual(["Kode Tanah", "TNH-000021"]);
    expect(document.sections[0].rows).toContainEqual(["Nama Tanah", "Tanah Kompleks Pelayanan"]);
    expect(document.sections[0].rows).not.toContainEqual(["Kode Bangunan", "TNH-000021"]);
  });
});
