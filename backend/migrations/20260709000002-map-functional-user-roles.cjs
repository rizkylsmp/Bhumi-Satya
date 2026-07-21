"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_role') THEN
          ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'admin';
          ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'pengelola_aset';
          ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'verifikator_aset';
          ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'viewer';
        END IF;

        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Users_role') THEN
          ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'admin';
          ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'pengelola_aset';
          ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'verifikator_aset';
          ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'viewer';
        END IF;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'viewer';
    `);

    await queryInterface.sequelize.query(`
      UPDATE "users"
      SET "role" = CASE lower("role"::text)
        WHEN 'admin_bpka' THEN 'admin'::"enum_users_role"
        WHEN 'admin_bpkad' THEN 'admin'::"enum_users_role"
        WHEN 'admin_bpn' THEN 'admin'::"enum_users_role"
        WHEN 'super_admin' THEN 'admin'::"enum_users_role"
        WHEN 'bpka' THEN 'pengelola_aset'::"enum_users_role"
        WHEN 'bpn' THEN 'verifikator_aset'::"enum_users_role"
        WHEN 'admin' THEN 'admin'::"enum_users_role"
        WHEN 'pengelola_aset' THEN 'pengelola_aset'::"enum_users_role"
        WHEN 'verifikator_aset' THEN 'verifikator_aset'::"enum_users_role"
        WHEN 'viewer' THEN 'viewer'::"enum_users_role"
        WHEN 'masyarakat' THEN 'masyarakat'::"enum_users_role"
        ELSE 'viewer'::"enum_users_role"
      END;
    `);

    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'users_role_target_check'
            AND conrelid = 'users'::regclass
        ) THEN
          ALTER TABLE "users"
          ADD CONSTRAINT "users_role_target_check"
          CHECK ("role"::text IN (
            'admin',
            'pengelola_aset',
            'verifikator_aset',
            'viewer',
            'masyarakat'
          ));
        END IF;
      END $$;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_role_target_check";
    `);

    await queryInterface.sequelize.query(`
      UPDATE "users"
      SET "role" = CASE lower("role"::text)
        WHEN 'admin' THEN 'admin_bpka'::"enum_users_role"
        WHEN 'pengelola_aset' THEN 'bpka'::"enum_users_role"
        WHEN 'verifikator_aset' THEN 'bpn'::"enum_users_role"
        WHEN 'viewer' THEN 'bpn'::"enum_users_role"
        WHEN 'masyarakat' THEN 'masyarakat'::"enum_users_role"
        ELSE 'bpn'::"enum_users_role"
      END;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'bpn';
    `);
  },
};
