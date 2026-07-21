"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_sewa_aset_status" ADD VALUE IF NOT EXISTS 'Diproses';
    `);
  },

  async down() {
    // PostgreSQL does not support removing a single enum value safely.
  },
};
