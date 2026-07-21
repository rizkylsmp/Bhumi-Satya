"use strict";

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    // 1. Add new ENUM values to Users.role
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'admin_bpka'`,
    );
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'bpka'`,
    );

    // 2. Update existing User records
    await queryInterface.sequelize.query(
      `UPDATE "Users" SET role = 'admin_bpka' WHERE role = 'admin_bpkad'`,
    );
    await queryInterface.sequelize.query(
      `UPDATE "Users" SET role = 'bpka' WHERE role = 'bpkad'`,
    );

    // 3. Update Aset records: kode_aset prefix
    await queryInterface.sequelize.query(
      `UPDATE "Asets" SET kode_aset = 'BPKA-' || SUBSTRING(kode_aset FROM 7) WHERE kode_aset LIKE 'BPKAD-%'`,
    );

    // 4. Update Aset records: jenis_aset
    await queryInterface.sequelize.query(
      `UPDATE "Asets" SET jenis_aset = 'Bidang Tanah' WHERE jenis_aset = 'Bidang Tanah'`,
    );

    // 5. Update Aset records: opd_pengguna
    await queryInterface.sequelize.query(
      `UPDATE "Asets" SET opd_pengguna = 'BPKA' WHERE opd_pengguna = 'BPKAD'`,
    );
  },

  async down(queryInterface, Sequelize) {
    // Revert Aset records
    await queryInterface.sequelize.query(
      `UPDATE "Asets" SET opd_pengguna = 'BPKAD' WHERE opd_pengguna = 'BPKA'`,
    );
    await queryInterface.sequelize.query(
      `UPDATE "Asets" SET jenis_aset = 'Bidang Tanah' WHERE jenis_aset = 'Bidang Tanah'`,
    );
    await queryInterface.sequelize.query(
      `UPDATE "Asets" SET kode_aset = 'BPKAD-' || SUBSTRING(kode_aset FROM 6) WHERE kode_aset LIKE 'BPKA-%'`,
    );
    // Revert User records
    await queryInterface.sequelize.query(
      `UPDATE "Users" SET role = 'bpkad' WHERE role = 'bpka'`,
    );
    await queryInterface.sequelize.query(
      `UPDATE "Users" SET role = 'admin_bpkad' WHERE role = 'admin_bpka'`,
    );
    // Note: cannot remove ENUM values from PostgreSQL without recreating the type
  },
};
