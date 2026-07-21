"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("pusat_data", "kecamatan", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn("pusat_data", "kelurahan", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn("pusat_data", "jenis_hak", {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
    await queryInterface.addColumn("pusat_data", "penggunaan", {
      type: Sequelize.STRING(200),
      allowNull: true,
    });
    await queryInterface.addColumn("pusat_data", "no_register", {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
    await queryInterface.addColumn("pusat_data", "id_pemda", {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
    await queryInterface.addColumn("pusat_data", "luas_kib", {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
    });
    await queryInterface.addColumn("pusat_data", "harga_perolehan", {
      type: Sequelize.DECIMAL(20, 2),
      allowNull: true,
    });
    await queryInterface.addColumn("pusat_data", "penggunaan_kib", {
      type: Sequelize.STRING(200),
      allowNull: true,
    });
    await queryInterface.addColumn("pusat_data", "keterangan", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("pusat_data", "tanggal_scan", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    await queryInterface.addColumn("pusat_data", "plotting_status", {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("pusat_data", "kecamatan");
    await queryInterface.removeColumn("pusat_data", "kelurahan");
    await queryInterface.removeColumn("pusat_data", "jenis_hak");
    await queryInterface.removeColumn("pusat_data", "penggunaan");
    await queryInterface.removeColumn("pusat_data", "no_register");
    await queryInterface.removeColumn("pusat_data", "id_pemda");
    await queryInterface.removeColumn("pusat_data", "luas_kib");
    await queryInterface.removeColumn("pusat_data", "harga_perolehan");
    await queryInterface.removeColumn("pusat_data", "penggunaan_kib");
    await queryInterface.removeColumn("pusat_data", "keterangan");
    await queryInterface.removeColumn("pusat_data", "tanggal_scan");
    await queryInterface.removeColumn("pusat_data", "plotting_status");
  },
};
