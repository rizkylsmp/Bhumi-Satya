"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        CREATE TYPE "enum_notifikasi_tipe" AS ENUM ('info', 'warning', 'success', 'error');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        CREATE TYPE "enum_notifikasi_kategori" AS ENUM ('aset', 'user', 'sistem', 'riwayat');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "notifikasi" (
        "id_notifikasi" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "users" ("id_user") ON UPDATE CASCADE ON DELETE CASCADE,
        "judul" VARCHAR(150) NOT NULL,
        "pesan" TEXT NOT NULL,
        "tipe" "enum_notifikasi_tipe" NOT NULL DEFAULT 'info',
        "kategori" "enum_notifikasi_kategori" NOT NULL DEFAULT 'sistem',
        "referensi_id" INTEGER NULL,
        "referensi_tabel" VARCHAR(50) NULL,
        "dibaca" BOOLEAN NOT NULL DEFAULT false,
        "dibaca_at" TIMESTAMP WITH TIME ZONE NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_notifikasi_user_created_at"
      ON "notifikasi" ("user_id", "created_at");
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_notifikasi_user_dibaca"
      ON "notifikasi" ("user_id", "dibaca");
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("notifikasi");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notifikasi_kategori";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notifikasi_tipe";');
  },
};
