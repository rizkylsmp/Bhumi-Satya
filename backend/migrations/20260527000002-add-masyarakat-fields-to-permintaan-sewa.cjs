"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "permintaan_sewa"
        ADD COLUMN IF NOT EXISTS "pemohon_user_id" INTEGER REFERENCES "users" ("id_user"),
        ADD COLUMN IF NOT EXISTS "pemohon_username" VARCHAR(50);
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("permintaan_sewa", "pemohon_username");
    await queryInterface.removeColumn("permintaan_sewa", "pemohon_user_id");
  },
};
