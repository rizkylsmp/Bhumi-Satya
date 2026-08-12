"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("sewa_aset");

    if (!table.kategori_sewa) {
      await queryInterface.addColumn("sewa_aset", "kategori_sewa", {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "Tanah",
      });
    }

    if (!table.kode_3d) {
      await queryInterface.addColumn("sewa_aset", "kode_3d", {
        type: Sequelize.STRING(40),
        allowNull: true,
        references: { model: "aset_3d_catalog", key: "kode_3d" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
    }

    await queryInterface.sequelize.query(`
      UPDATE "sewa_aset"
      SET "kategori_sewa" = 'Tanah'
      WHERE "kategori_sewa" IS NULL
         OR "kategori_sewa" NOT IN ('Tanah', 'Bangunan');

      CREATE INDEX IF NOT EXISTS "sewa_aset_kategori_sewa_idx"
        ON "sewa_aset" ("kategori_sewa");
      CREATE INDEX IF NOT EXISTS "sewa_aset_kode_3d_idx"
        ON "sewa_aset" ("kode_3d");
    `);
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("sewa_aset");
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "sewa_aset_kategori_sewa_idx";
      DROP INDEX IF EXISTS "sewa_aset_kode_3d_idx";
    `);
    if (table.kode_3d) await queryInterface.removeColumn("sewa_aset", "kode_3d");
    if (table.kategori_sewa) {
      await queryInterface.removeColumn("sewa_aset", "kategori_sewa");
    }
  },
};
