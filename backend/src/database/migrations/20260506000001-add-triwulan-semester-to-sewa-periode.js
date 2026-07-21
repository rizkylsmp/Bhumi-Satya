/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_sewa_aset_periode_bayar') THEN
          ALTER TYPE "enum_sewa_aset_periode_bayar" ADD VALUE IF NOT EXISTS 'Triwulan';
          ALTER TYPE "enum_sewa_aset_periode_bayar" ADD VALUE IF NOT EXISTS 'Semester';
        END IF;
      END
      $$;
    `);
  },

  async down() {
    // PostgreSQL does not support dropping enum values directly.
    // Existing Triwulan/Semester data should be migrated manually before a rollback.
  },
};
