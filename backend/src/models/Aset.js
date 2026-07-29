import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Aset = sequelize.define(
  "Aset",
  {
    id_aset: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    kode_aset: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
    },
    nama_aset: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    lokasi: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    koordinat_lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    koordinat_long: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
    luas: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "Aktif",
        "Bermasalah",
        "Indikasi Bermasalah",
        "Diblokir",
      ),
      defaultValue: "Aktif",
    },
    jenis_masalah: {
      type: DataTypes.ENUM("Sengketa", "Konflik", "Berperkara"),
      allowNull: true,
      comment:
        "Jenis masalah (hanya jika status Bermasalah/Indikasi Bermasalah)",
    },
    jenis_aset: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    sumber: {
      type: DataTypes.ENUM("BPN", "BPKA"),
      allowNull: false,
      defaultValue: "BPN",
      comment: "Sumber data: BPN atau BPKA",
    },
    nilai_aset: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
    },
    tahun_perolehan: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    nomor_sertifikat: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    nomor_hak: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment:
        "Nomor hak dari sumber pertanahan; nomor_sertifikat tetap field kanonik",
    },
    status_sertifikat: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    foto_aset: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    dokumen_pendukung: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    keterangan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // ========== DATA LEGAL ==========
    jenis_hak: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Jenis Hak: HM, HPL, HP, Tanah Negara",
    },
    atas_nama: {
      type: DataTypes.STRING(150),
      allowNull: true,
      comment: "Atas Nama: Pemda / Instansi",
    },
    tanggal_sertifikat: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "Tanggal Terbit Sertifikat",
    },
    surat_ukur: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Nomor surat ukur / gambar situasi",
    },
    produk: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Produk sertifikat, misalnya elektronik atau analog",
    },
    pemilik_pertama: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: "Pemilik pertama berdasarkan data pertanahan",
    },
    pemilik_akhir: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: "Pemilik akhir berdasarkan data pertanahan",
    },
    riwayat_perolehan: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Hibah, Pembelian, Tukar Menukar, Penyerahan PSU",
    },
    status_hukum: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Aman, Sengketa, Dalam Proses Sertipikasi, Diblokir",
    },

    // ========== DATA FISIK ==========
    kecamatan: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Kecamatan",
    },
    desa_kelurahan: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Desa/Kelurahan",
    },
    luas_lapangan: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: "Luas kondisi lapangan (m²)",
    },
    batas_utara: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    batas_selatan: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    batas_timur: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    batas_barat: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    penggunaan_saat_ini: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Kantor, Sekolah, Lahan Kosong, Disewa Pihak Ketiga, dll",
    },

    // ========== IDENTIFIKASI SPASIAL ==========
    nib: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Nomor Identifikasi Bidang dari WebGIS BPN/BPKA",
    },
    kw: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: "Kode Wilayah (KW) dari data BPN, misal KW1, KW2",
    },

    // ========== DATA DARI KIB / EXCEL BPKA ==========
    nibar: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Nomor Identifikasi Barang (NIBAR)",
    },
    id_pemda: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "ID Pemda",
    },
    kode_barang: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Kode Barang dari KIB",
    },
    no_register: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: "Nomor Register",
    },
    luas_kib: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: "Luas di KIB (m²)",
    },
    harga_perolehan: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      comment: "Harga perolehan aset",
    },
    penggunaan_kib: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: "Penggunaan menurut KIB",
    },
    tanggal_scan: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "Tanggal sertifikat di-scan",
    },
    file_sertifikat: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: "Path file sertifikat",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Catatan tambahan dari data Excel",
    },
    plotting_status: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Status plotting maps: ok, GA NGERTI LOKASI, dll",
    },

    // ========== DATA ADMINISTRATIF / KEUANGAN ==========
    kode_bmd: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Kodefikasi Barang Milik Daerah",
    },
    nilai_buku: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
    },
    nilai_njop: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
    },
    sk_penetapan: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: "SK Penetapan Status Penggunaan",
    },
    opd_pengguna: {
      type: DataTypes.STRING(150),
      allowNull: true,
      comment: "OPD Pengguna aset",
    },

    // ========== DATA PAJAK ==========
    pajak_fid: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "FID objek pajak dari sumber data Bapenda",
    },
    pajak_status: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Status verifikasi objek pajak",
    },
    nop: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Nomor Objek Pajak (NOP)",
    },
    nama_wajib_pajak: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: "Nama wajib pajak",
    },
    nilai_bumi_per_m2: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      comment: "Nilai bumi atau tanah per meter persegi (rupiah)",
    },
    nilai_bangunan_per_m2: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      comment: "Nilai bangunan per meter persegi (rupiah)",
    },
    luas_bumi_bapenda: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: "Luas bumi atau tanah menurut Bapenda (m²)",
    },
    luas_bangunan_bapenda: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: "Luas bangunan menurut Bapenda (m²)",
    },
    luas_bumi_pemetaan: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: "Luas bumi atau tanah hasil pemetaan (m²)",
    },
    luas_bangunan_pemetaan: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: "Luas bangunan hasil pemetaan (m²)",
    },
    njop_bumi_pemetaan: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      comment: "NJOP bumi hasil pemetaan (rupiah)",
    },
    njop_bangunan_pemetaan: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      comment: "NJOP bangunan hasil pemetaan (rupiah)",
    },
    pbb_pemetaan: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      comment: "Pajak Bumi dan Bangunan hasil pemetaan (rupiah)",
    },
    volume_bangunan: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      comment: "Volume bangunan (m³)",
    },
    tinggi_bangunan: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: "Tinggi bangunan untuk data pajak (meter)",
    },

    // ========== DATA SPASIAL ==========
    polygon_bidang: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Polygon bidang tanah dalam format GeoJSON",
    },
    building_footprint: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Tapak bangunan terpisah dari polygon bidang tanah",
    },
    building_height_m: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
    building_base_elevation_m: {
      type: DataTypes.DECIMAL(9, 2),
      allowNull: true,
    },
    building_floors: { type: DataTypes.INTEGER, allowNull: true },
    building_height_source: { type: DataTypes.STRING(30), allowNull: true },
    building_height_quality: { type: DataTypes.STRING(20), allowNull: true },
    model_3d_lod: { type: DataTypes.STRING(10), allowNull: true },
    model_3d_source_crs: { type: DataTypes.STRING(32), allowNull: true },
    model_3d_recorded_at: { type: DataTypes.DATEONLY, allowNull: true },
    model_3d_accuracy_m: { type: DataTypes.DECIMAL(8, 3), allowNull: true },

    // ========== REKONSILIASI INTEGRASI ==========
    reconciliation_status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "belum_diperiksa",
      comment:
        "Status rekonsiliasi aset: belum_diperiksa, cocok, konflik, terverifikasi",
    },
    reconciliation_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Catatan rekonsiliasi data BPN/BPKA",
    },
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    verified_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id_user",
      },
    },

    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id_user",
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "aset",
    timestamps: false,
  },
);

export default Aset;
