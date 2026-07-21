"use strict";

const columns = {
  status: { type: "STRING", length: 50, allowNull: true, defaultValue: "Aktif" },
  jenis_masalah: { type: "STRING", length: 50, allowNull: true },
  jenis_aset: { type: "STRING", length: 50, allowNull: true },
  sumber: { type: "STRING", length: 20, allowNull: true, defaultValue: "BPN" },
  nilai_aset: { type: "DECIMAL", precision: 20, scale: 2, allowNull: true },
  tahun_perolehan: { type: "INTEGER", allowNull: true },
  tanggal_sertifikat: { type: "DATEONLY", allowNull: true },
  riwayat_perolehan: { type: "STRING", length: 50, allowNull: true },
  status_hukum: { type: "STRING", length: 50, allowNull: true },
  batas_utara: { type: "STRING", length: 200, allowNull: true },
  batas_selatan: { type: "STRING", length: 200, allowNull: true },
  batas_timur: { type: "STRING", length: 200, allowNull: true },
  batas_barat: { type: "STRING", length: 200, allowNull: true },
  penggunaan_saat_ini: { type: "STRING", length: 100, allowNull: true },
  kode_bmd: { type: "STRING", length: 50, allowNull: true },
  nilai_buku: { type: "DECIMAL", precision: 20, scale: 2, allowNull: true },
  nilai_njop: { type: "DECIMAL", precision: 20, scale: 2, allowNull: true },
  sk_penetapan: { type: "STRING", length: 200, allowNull: true },
  opd_pengguna: { type: "STRING", length: 150, allowNull: true },
  nibar: { type: "STRING", length: 50, allowNull: true },
  kode_barang: { type: "STRING", length: 50, allowNull: true },
  file_sertifikat: { type: "STRING", length: 500, allowNull: true },
  notes: { type: "TEXT", allowNull: true },
  koordinat_lat: { type: "DECIMAL", precision: 10, scale: 8, allowNull: true },
  koordinat_long: { type: "DECIMAL", precision: 11, scale: 8, allowNull: true },
  polygon_bidang: { type: "JSON", allowNull: true },
  foto_aset: { type: "STRING", length: 255, allowNull: true },
  dokumen_pendukung: { type: "JSON", allowNull: true },
};

const existingMigrationColumns = {
  no_register: { type: "STRING", length: 20, allowNull: true },
  id_pemda: { type: "STRING", length: 50, allowNull: true },
  luas_kib: { type: "DECIMAL", precision: 15, scale: 2, allowNull: true },
  harga_perolehan: { type: "DECIMAL", precision: 20, scale: 2, allowNull: true },
  penggunaan_kib: { type: "STRING", length: 200, allowNull: true },
  tanggal_scan: { type: "DATEONLY", allowNull: true },
  plotting_status: { type: "STRING", length: 50, allowNull: true },
};

const getType = (Sequelize, definition) => {
  if (definition.type === "STRING") return Sequelize.STRING(definition.length);
  if (definition.type === "DECIMAL") {
    return Sequelize.DECIMAL(definition.precision, definition.scale);
  }
  return Sequelize[definition.type];
};

const normalizeColumns = (Sequelize, source) =>
  Object.fromEntries(
    Object.entries(source).map(([name, definition]) => [
      name,
      {
        type: getType(Sequelize, definition),
        allowNull: definition.allowNull,
        ...(definition.defaultValue !== undefined
          ? { defaultValue: definition.defaultValue }
          : {}),
      },
    ]),
  );

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("pusat_data");
    const allColumns = normalizeColumns(Sequelize, {
      ...columns,
      ...existingMigrationColumns,
    });

    for (const [name, definition] of Object.entries(allColumns)) {
      if (!table[name]) {
        await queryInterface.addColumn("pusat_data", name, definition);
      }
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("pusat_data");

    for (const name of Object.keys(columns).reverse()) {
      if (table[name]) {
        await queryInterface.removeColumn("pusat_data", name);
      }
    }
  },
};
