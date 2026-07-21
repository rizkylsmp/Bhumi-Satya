/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface) {
  // 1. Add new ENUM values first
  await queryInterface.sequelize.query(`
    ALTER TYPE "enum_aset_status" ADD VALUE IF NOT EXISTS 'Bermasalah';
  `);
  await queryInterface.sequelize.query(`
    ALTER TYPE "enum_aset_status" ADD VALUE IF NOT EXISTS 'Indikasi Bermasalah';
  `);

  // 2. Update existing data
  await queryInterface.sequelize.query(`
    UPDATE aset SET status = 'Bermasalah' WHERE status = 'Berperkara';
  `);
  await queryInterface.sequelize.query(`
    UPDATE aset SET status = 'Indikasi Bermasalah' WHERE status = 'Indikasi Berperkara';
  `);

  // 3. Add jenis_masalah column
  await queryInterface.sequelize.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_aset_jenis_masalah') THEN
        CREATE TYPE "enum_aset_jenis_masalah" AS ENUM ('Sengketa', 'Konflik', 'Berperkara');
      END IF;
    END$$;
  `);

  await queryInterface.sequelize.query(`
    ALTER TABLE aset ADD COLUMN IF NOT EXISTS jenis_masalah "enum_aset_jenis_masalah" NULL;
  `);

  // 4. Set default jenis_masalah for existing bermasalah records
  await queryInterface.sequelize.query(`
    UPDATE aset SET jenis_masalah = 'Berperkara' WHERE status IN ('Bermasalah', 'Indikasi Bermasalah') AND jenis_masalah IS NULL;
  `);

  // 5. Recreate the ENUM without old values
  // PostgreSQL doesn't support removing ENUM values directly,
  // so we recreate the column with the new type
  await queryInterface.sequelize.query(`
    ALTER TABLE aset ALTER COLUMN status TYPE VARCHAR(50);
  `);
  await queryInterface.sequelize.query(`
    DROP TYPE IF EXISTS "enum_aset_status";
  `);
  await queryInterface.sequelize.query(`
    CREATE TYPE "enum_aset_status" AS ENUM ('Aktif', 'Bermasalah', 'Indikasi Bermasalah', 'Tidak Aktif');
  `);
  await queryInterface.sequelize.query(`
    ALTER TABLE aset ALTER COLUMN status TYPE "enum_aset_status" USING status::"enum_aset_status";
  `);
}

export async function down(queryInterface) {
  // Reverse: Bermasalah -> Berperkara
  await queryInterface.sequelize.query(`
    ALTER TABLE aset ALTER COLUMN status TYPE VARCHAR(50);
  `);
  await queryInterface.sequelize.query(`
    UPDATE aset SET status = 'Berperkara' WHERE status = 'Bermasalah';
  `);
  await queryInterface.sequelize.query(`
    UPDATE aset SET status = 'Indikasi Berperkara' WHERE status = 'Indikasi Bermasalah';
  `);
  await queryInterface.sequelize.query(`
    DROP TYPE IF EXISTS "enum_aset_status";
  `);
  await queryInterface.sequelize.query(`
    CREATE TYPE "enum_aset_status" AS ENUM ('Aktif', 'Berperkara', 'Indikasi Berperkara', 'Tidak Aktif');
  `);
  await queryInterface.sequelize.query(`
    ALTER TABLE aset ALTER COLUMN status TYPE "enum_aset_status" USING status::"enum_aset_status";
  `);

  // Remove jenis_masalah column
  await queryInterface.sequelize.query(`
    ALTER TABLE aset DROP COLUMN IF EXISTS jenis_masalah;
  `);
  await queryInterface.sequelize.query(`
    DROP TYPE IF EXISTS "enum_aset_jenis_masalah";
  `);
}
