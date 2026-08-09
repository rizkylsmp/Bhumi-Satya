import { describe, expect, it } from "vitest";
import {
  buildMapSearchEntries,
  searchMapRecords,
  splitMapSearchHighlight,
} from "./mapSearch";

describe("map search", () => {
  const assets = [
    {
      id: 1,
      kode_2d: "2D-STPN-01",
      nama_aset: "Bidang Kampus",
      kecamatan: "Gamping",
      active_models_3d: [
        {
          id_model_3d: 11,
          kode_3d: "3D-AULA-01",
          building_name: "Gedung Aula Barat",
          lod: "LOD2",
        },
      ],
    },
    { id: 2, nama_aset: "Lapangan Upacara", kecamatan: "Kasihan" },
  ];

  it("indexes top-level and nested 3D attributes", () => {
    const entries = buildMapSearchEntries(assets[0]);
    expect(entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: "Kode 2D", value: "2D-STPN-01" }),
      expect.objectContaining({ label: "Nama Bangunan", value: "Gedung Aula Barat" }),
      expect.objectContaining({ label: "LOD", value: "LOD2" }),
    ]));
  });

  it("matches multiple words across different asset fields", () => {
    const results = searchMapRecords(assets, "aula gamping");
    expect(results).toHaveLength(1);
    expect(results[0].record.id).toBe(1);
    expect(results[0].matches.map((match) => match.value)).toContain("Gedung Aula Barat");
  });

  it("creates highlighted text segments", () => {
    expect(splitMapSearchHighlight("Gedung Aula Barat", "aula")).toEqual([
      { text: "Gedung ", highlighted: false },
      { text: "Aula", highlighted: true },
      { text: " Barat", highlighted: false },
    ]);
  });
});
