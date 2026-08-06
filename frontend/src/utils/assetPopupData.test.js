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
      { label: "Kode Aset", value: "AST-001" },
      { label: "Nama Aset", value: "Gedung Utama" },
      { label: "Jenis Aset", value: "Bangunan" },
      { label: "Luas Terdata", value: "1250.5", format: "area" },
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

  it("shows the shared building name in general and 3D data", () => {
    const result = buildAssetPopupData({
      kode_aset: "AST-001",
      nama_aset: "Aset Induk",
      kode_3d: "3D-001",
      building_name_3d: "Nama Bangunan Lama",
      popup_context: "3d",
      active_model_3d: {
        kode_3d: "3D-002",
        building_name: "Gedung Laboratorium",
        lod: "LOD2",
      },
    });

    expect(result.catalogCode).toBe("3D-002");
    expect(result.context).toBe("3d");
    expect(result.general).toContainEqual({
      label: "Nama Bangunan",
      value: "Gedung Laboratorium",
    });
    expect(result.model).toMatchObject({
      name: "Gedung Laboratorium",
      available: true,
    });
  });

  it("shows the building count when a 2D parcel is selected", () => {
    const result = buildAssetPopupData({
      kode_aset: "AST-002",
      kode_2d: "2D-002",
      popup_context: "2d",
      building_count_3d: 4,
    });

    expect(result.parcelCode).toBe("2D-002");
    expect(result.general).toContainEqual({
      label: "Kode 2D",
      value: "2D-002",
    });
    expect(result.general).toContainEqual({
      label: "Jumlah Bangunan 3D",
      value: "4 bangunan",
    });
  });

  it("creates the tax section only from available tax values", () => {
    const result = buildAssetPopupData({
      pajak_status: "Terverifikasi",
      nop: "35.75.010.001.001-0001.0",
      nama_wajib_pajak: "",
      njop_bumi_pemetaan: "250000000",
      pbb_pemetaan: null,
    });

    expect(result.tax).toEqual([
      { label: "Status Objek Pajak", value: "Terverifikasi" },
      {
        label: "NOP",
        value: "35.75.010.001.001-0001.0",
      },
      {
        label: "NJOP Bumi Pemetaan",
        value: "250000000",
        format: "currency",
      },
    ]);
  });

  it("groups physical, KIB, administrative, and spatial data", () => {
    const result = buildAssetPopupData({
      kecamatan: "Mantrijeron",
      batas_utara: "Jalan lingkungan",
      nibar: "NBR-12",
      harga_perolehan: "150000000",
      kode_bmd: "01.03.04",
      nilai_buku: "120000000",
      koordinat_lat: "-7.8101",
      koordinat_long: "110.3612",
      polygon_bidang: { type: "Polygon", coordinates: [] },
      kw: "KW1",
    });

    expect(result.physical).toEqual([
      { label: "Kecamatan", value: "Mantrijeron" },
      { label: "Batas Utara", value: "Jalan lingkungan" },
    ]);
    expect(result.kib).toEqual([
      { label: "NIBAR", value: "NBR-12" },
      {
        label: "Harga Perolehan",
        value: "150000000",
        format: "currency",
      },
    ]);
    expect(result.administrative).toEqual([
      { label: "Kode BMD", value: "01.03.04" },
      { label: "Nilai Buku", value: "120000000", format: "currency" },
    ]);
    expect(result.spatial).toEqual([
      { label: "Kode Wilayah (KW)", value: "KW1" },
      { label: "Latitude", value: "-7.8101", format: "coordinate" },
      { label: "Longitude", value: "110.3612", format: "coordinate" },
      { label: "CRS Koordinat", value: "WGS 84 (EPSG:4326)" },
      { label: "Polygon Bidang", value: "Tersedia" },
    ]);
  });

  it("includes supporting 2D spatial attributes when available", () => {
    const result = buildAssetPopupData({
      nib: "NIB-001",
      plotting_status: "Sudah diplot",
      luas: "875.25",
      building_footprint: {
        type: "Polygon",
        coordinates: [],
      },
      sumber: "Survei lapangan",
    });

    expect(result.spatial).toEqual([
      { label: "NIB", value: "NIB-001" },
      { label: "Status Plotting", value: "Sudah diplot" },
      { label: "Luas Bidang", value: "875.25", format: "area" },
      { label: "Tapak Bangunan", value: "Tersedia" },
      { label: "Sumber Data", value: "Survei lapangan" },
    ]);
  });
});
