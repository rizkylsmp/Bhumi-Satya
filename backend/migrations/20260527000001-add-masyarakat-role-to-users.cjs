"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_role') THEN
          ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'masyarakat';
        END IF;

        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Users_role') THEN
          ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'masyarakat';
        END IF;
      END $$;
    `);
  },

  async down() {
    // PostgreSQL tidak mendukung penghapusan value enum secara aman tanpa rebuild tipe.
  },
};
