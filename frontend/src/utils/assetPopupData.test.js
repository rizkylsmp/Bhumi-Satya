import { describe, expect, it } from "vitest";
import {
  buildAssetPopupData,
  resolvePopupModel,
} from "./assetPopupData";

describe("asset popup data", () => {
  it("uses only available asset fields", () => {
    const result = buildAssetPopupData({
      kode_aset: "AST-001",
      nama_aset: "Gedung Utama",
      jenis_aset: "Bangunan",
      lokasi: "Jl. Tata Bumi",
      luas: "1250.5",
      nib: null,
      opd_pengguna: "Tidak ditampilkan",
    });

    expect(result.title).toBe("Gedung Utama");
    expect(result.assetCode).toBe("AST-001");
    expect(result.location).toBe("Jl. Tata Bumi");
    expect(result.area).toBe("1250.5");
    expect(result.details).toEqual([
      { label: "Jenis Aset", value: "Bangunan" },
    ]);
  });

  it("prioritizes the selected preview model over the published model", () => {
    const published = { id_model_3d: 1, lod: "LOD1", version: 1 };
    const selected = {
      id_model_3d: 2,
      lod: "LOD2",
      version: 3,
      format: "GLB",
      is_active: false,
    };
    const asset = {
      active_model_3d: published,
      building_height_m: 18,
      building_floors: 5,
    };

    expect(resolvePopupModel(asset, selected)).toBe(selected);
    expect(buildAssetPopupData(asset, selected).model).toMatchObject({
      id: 2,
      lod: "LOD2",
      version: 3,
      format: "GLB",
      height: 18,
      floors: 5,
      active: false,
    });
  });
});
