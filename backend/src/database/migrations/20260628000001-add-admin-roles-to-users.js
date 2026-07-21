/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface) {
  await queryInterface.sequelize.query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_role') THEN
        ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'admin_bpka';
        ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'admin_bpn';
        ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'bpka';
        ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'bpn';
      END IF;

      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Users_role') THEN
        ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'admin_bpka';
        ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'admin_bpn';
        ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'bpka';
        ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'bpn';
      END IF;
    END $$;
  `);
}

export async function down() {
  // PostgreSQL tidak mendukung penghapusan value enum secara aman tanpa rebuild tipe.
}
