"use strict";

const taxColumns = {
  pajak_fid: "INTEGER",
  pajak_status: "VARCHAR(50)",
  nop: "VARCHAR(100)",
  nama_wajib_pajak: "VARCHAR(200)",
  nilai_bumi_per_m2: "NUMERIC(20, 2)",
  nilai_bangunan_per_m2: "NUMERIC(20, 2)",
  luas_bumi_bapenda: "NUMERIC(15, 2)",
  luas_bangunan_bapenda: "NUMERIC(15, 2)",
  luas_bumi_pemetaan: "NUMERIC(15, 2)",
  luas_bangunan_pemetaan: "NUMERIC(15, 2)",
  njop_bumi_pemetaan: "NUMERIC(20, 2)",
  njop_bangunan_pemetaan: "NUMERIC(20, 2)",
  pbb_pemetaan: "NUMERIC(20, 2)",
  volume_bangunan: "NUMERIC(18, 2)",
  tinggi_bangunan: "NUMERIC(10, 2)",
};

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface) {
    for (const [columnName, columnType] of Object.entries(taxColumns)) {
      await queryInterface.sequelize.query(`
        ALTER TABLE "aset"
        ADD COLUMN IF NOT EXISTS "${columnName}" ${columnType};
      `);
    }

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_aset_pajak_fid"
      ON "aset" ("pajak_fid")
      WHERE "pajak_fid" IS NOT NULL;
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_aset_nop"
      ON "aset" ("nop")
      WHERE "nop" IS NOT NULL AND trim("nop") <> '';
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS "idx_aset_nop";',
    );
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS "idx_aset_pajak_fid";',
    );

    for (const columnName of Object.keys(taxColumns).reverse()) {
      await queryInterface.sequelize.query(`
        ALTER TABLE "aset" DROP COLUMN IF EXISTS "${columnName}";
      `);
    }
  },
};
