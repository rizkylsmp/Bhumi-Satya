import { describe, expect, it } from "vitest";
import { buildPdf, getPdfBuildingIdentity } from "./pdfExport";

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
});
