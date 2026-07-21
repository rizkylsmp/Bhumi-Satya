import { DataTypes } from "sequelize";

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  // ========== DATA LEGAL ==========
  await queryInterface.addColumn("aset", "jenis_hak", {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: "Jenis Hak: HM, HPL, HP, Tanah Negara",
  });

  await queryInterface.addColumn("aset", "atas_nama", {
    type: DataTypes.STRING(150),
    allowNull: true,
    comment: "Atas Nama: Pemda / Instansi",
  });

  await queryInterface.addColumn("aset", "tanggal_sertifikat", {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: "Tanggal Terbit Sertifikat",
  });

  await queryInterface.addColumn("aset", "riwayat_perolehan", {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: "Hibah, Pembelian, Tukar Menukar, Penyerahan PSU",
  });

  await queryInterface.addColumn("aset", "status_hukum", {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: "Aman, Sengketa, Dalam Proses Sertipikasi, Diblokir",
  });

  // ========== DATA FISIK ==========
  await queryInterface.addColumn("aset", "desa_kelurahan", {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: "Desa/Kelurahan",
  });

  await queryInterface.addColumn("aset", "luas_lapangan", {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    comment: "Luas kondisi lapangan (m²)",
  });

  await queryInterface.addColumn("aset", "batas_utara", {
    type: DataTypes.STRING(200),
    allowNull: true,
  });

  await queryInterface.addColumn("aset", "batas_selatan", {
    type: DataTypes.STRING(200),
    allowNull: true,
  });

  await queryInterface.addColumn("aset", "batas_timur", {
    type: DataTypes.STRING(200),
    allowNull: true,
  });

  await queryInterface.addColumn("aset", "batas_barat", {
    type: DataTypes.STRING(200),
    allowNull: true,
  });

  await queryInterface.addColumn("aset", "penggunaan_saat_ini", {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: "Kantor, Sekolah, Lahan Kosong, Disewa Pihak Ketiga",
  });

  // ========== DATA ADMINISTRATIF / KEUANGAN ==========
  await queryInterface.addColumn("aset", "kode_bmd", {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: "Kodefikasi Barang Milik Daerah",
  });

  await queryInterface.addColumn("aset", "nilai_buku", {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: true,
  });

  await queryInterface.addColumn("aset", "nilai_njop", {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: true,
  });

  await queryInterface.addColumn("aset", "sk_penetapan", {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: "SK Penetapan Status Penggunaan",
  });

  await queryInterface.addColumn("aset", "opd_pengguna", {
    type: DataTypes.STRING(150),
    allowNull: true,
    comment: "OPD Pengguna aset",
  });

  // ========== DATA SPASIAL ==========
  await queryInterface.addColumn("aset", "polygon_bidang", {
    type: DataTypes.JSON,
    allowNull: true,
    comment: "Polygon bidang tanah dalam format GeoJSON",
  });
}

export async function down(queryInterface, Sequelize) {
  // Remove all added columns in reverse order
  await queryInterface.removeColumn("aset", "polygon_bidang");
  await queryInterface.removeColumn("aset", "opd_pengguna");
  await queryInterface.removeColumn("aset", "sk_penetapan");
  await queryInterface.removeColumn("aset", "nilai_njop");
  await queryInterface.removeColumn("aset", "nilai_buku");
  await queryInterface.removeColumn("aset", "kode_bmd");
  await queryInterface.removeColumn("aset", "penggunaan_saat_ini");
  await queryInterface.removeColumn("aset", "batas_barat");
  await queryInterface.removeColumn("aset", "batas_timur");
  await queryInterface.removeColumn("aset", "batas_selatan");
  await queryInterface.removeColumn("aset", "batas_utara");
  await queryInterface.removeColumn("aset", "luas_lapangan");
  await queryInterface.removeColumn("aset", "desa_kelurahan");
  await queryInterface.removeColumn("aset", "status_hukum");
  await queryInterface.removeColumn("aset", "riwayat_perolehan");
  await queryInterface.removeColumn("aset", "tanggal_sertifikat");
  await queryInterface.removeColumn("aset", "atas_nama");
  await queryInterface.removeColumn("aset", "jenis_hak");
}
