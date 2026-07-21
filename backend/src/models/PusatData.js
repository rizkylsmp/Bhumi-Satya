import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const PusatData = sequelize.define(
  "PusatData",
  {
    id_pusat_data: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    kode_aset: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Kode aset BPN",
    },
    nama_aset: {
      type: DataTypes.STRING(150),
      allowNull: true,
      comment: "Nama aset",
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: "Aktif",
    },
    jenis_masalah: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    jenis_aset: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    sumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: "BPN",
    },
    nib: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Nomor Identifikasi Bidang",
    },
    nomor_hak: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Nomor Hak / Nomor Sertifikat",
    },
    jenis_hak: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Hak Pakai, Hak Milik, HGB, dll",
    },
    luas: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: "Luas dalam meter persegi",
    },
    luas_lapangan: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: "Luas lapangan dalam meter persegi",
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
    penggunaan: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: "Penggunaan saat ini",
    },
    penggunaan_saat_ini: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    kecamatan: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    kelurahan: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    alamat: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status_sertifikat: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Sudah/Belum Sertifikat",
    },
    surat_ukur: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    pemilik_pertama: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    pemilik_akhir: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    atas_nama: {
      type: DataTypes.STRING(150),
      allowNull: true,
      comment: "Atas Nama pemegang hak",
    },
    tanggal_sertifikat: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    riwayat_perolehan: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    status_hukum: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    produk: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Produk sertifikat (Elektronik/Analog)",
    },
    kw: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Kantor Wilayah",
    },
    opd: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: "Organisasi Perangkat Daerah",
    },
    opd_pengguna: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    nilai_aset: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
    },
    tahun_perolehan: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    kode_bmd: {
      type: DataTypes.STRING(50),
      allowNull: true,
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
    },
    nibar: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    id_pemda: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    kode_barang: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    no_register: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    luas_kib: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    harga_perolehan: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
    },
    penggunaan_kib: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    tanggal_scan: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    file_sertifikat: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    plotting_status: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    koordinat_lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    koordinat_long: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
    polygon_bidang: {
      type: DataTypes.JSON,
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
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    tableName: "pusat_data",
    timestamps: false,
  },
);

export default PusatData;
