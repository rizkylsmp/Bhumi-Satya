"use strict";

const asetColumns = {
  nomor_hak: {
    type: "VARCHAR(100)",
    comment:
      "Nomor hak dari sumber pertanahan; nomor_sertifikat tetap field kanonik",
  },
  surat_ukur: {
    type: "VARCHAR(100)",
    comment: "Nomor surat ukur / gambar situasi",
  },
  produk: {
    type: "VARCHAR(100)",
    comment: "Produk sertifikat, misalnya elektronik atau analog",
  },
  pemilik_pertama: {
    type: "VARCHAR(200)",
    comment: "Pemilik pertama berdasarkan data pertanahan",
  },
  pemilik_akhir: {
    type: "VARCHAR(200)",
    comment: "Pemilik akhir berdasarkan data pertanahan",
  },
  reconciliation_status: {
    type: "VARCHAR(30) NOT NULL DEFAULT 'belum_diperiksa'",
    comment:
      "Status rekonsiliasi aset: belum_diperiksa, cocok, konflik, terverifikasi",
  },
  reconciliation_notes: {
    type: "TEXT",
    comment: "Catatan rekonsiliasi data BPN/BPKA",
  },
  verified_at: {
    type: "TIMESTAMP WITH TIME ZONE",
  },
  verified_by: {
    type: "INTEGER",
  },
};

const addColumnIfMissing = async (
  queryInterface,
  tableName,
  columnName,
  definition,
) => {
  await queryInterface.sequelize.query(`
    ALTER TABLE "${tableName}"
    ADD COLUMN IF NOT EXISTS "${columnName}" ${definition.type};
  `);

  if (definition.comment) {
    await queryInterface.sequelize.query(`
      COMMENT ON COLUMN "${tableName}"."${columnName}" IS ${queryInterface.sequelize.escape(
        definition.comment,
      )};
    `);
  }
};

const dropConstraintIfExists = async (
  queryInterface,
  tableName,
  constraintName,
) => {
  await queryInterface.sequelize.query(`
    ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${constraintName}";
  `);
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    for (const [columnName, definition] of Object.entries(asetColumns)) {
      await addColumnIfMissing(queryInterface, "aset", columnName, definition);
    }

    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'aset_reconciliation_status_check'
            AND conrelid = 'aset'::regclass
        ) THEN
          ALTER TABLE "aset"
          ADD CONSTRAINT "aset_reconciliation_status_check"
          CHECK ("reconciliation_status" IN (
            'belum_diperiksa',
            'cocok',
            'konflik',
            'terverifikasi'
          ));
        END IF;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'aset_verified_by_fkey'
            AND conrelid = 'aset'::regclass
        ) THEN
          ALTER TABLE "aset"
          ADD CONSTRAINT "aset_verified_by_fkey"
          FOREIGN KEY ("verified_by")
          REFERENCES "users" ("id_user")
          ON UPDATE CASCADE
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "aset_sumber" (
        "id_aset_sumber" SERIAL PRIMARY KEY,
        "id_aset" INTEGER NOT NULL,
        "instansi" VARCHAR(20) NOT NULL,
        "source_table" VARCHAR(50) NOT NULL,
        "source_id" INTEGER NULL,
        "source_identifier" VARCHAR(150) NULL,
        "import_batch" VARCHAR(100) NULL,
        "reference_values" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "imported_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "imported_by" INTEGER NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "aset_reconciliation" (
        "id_reconciliation" SERIAL PRIMARY KEY,
        "id_aset" INTEGER NOT NULL,
        "id_pusat_data" INTEGER NULL,
        "status" VARCHAR(30) NOT NULL DEFAULT 'belum_diperiksa',
        "match_rule" VARCHAR(50) NULL,
        "match_confidence" NUMERIC(5, 2) NULL,
        "existing_values" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "proposed_values" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "conflict_fields" JSONB NOT NULL DEFAULT '[]'::jsonb,
        "resolution_values" JSONB NULL,
        "notes" TEXT NULL,
        "reviewed_by" INTEGER NULL,
        "reviewed_at" TIMESTAMP WITH TIME ZONE NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'aset_sumber_aset_fkey'
            AND conrelid = 'aset_sumber'::regclass
        ) THEN
          ALTER TABLE "aset_sumber"
          ADD CONSTRAINT "aset_sumber_aset_fkey"
          FOREIGN KEY ("id_aset")
          REFERENCES "aset" ("id_aset")
          ON UPDATE CASCADE
          ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'aset_sumber_imported_by_fkey'
            AND conrelid = 'aset_sumber'::regclass
        ) THEN
          ALTER TABLE "aset_sumber"
          ADD CONSTRAINT "aset_sumber_imported_by_fkey"
          FOREIGN KEY ("imported_by")
          REFERENCES "users" ("id_user")
          ON UPDATE CASCADE
          ON DELETE SET NULL;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'aset_sumber_instansi_check'
            AND conrelid = 'aset_sumber'::regclass
        ) THEN
          ALTER TABLE "aset_sumber"
          ADD CONSTRAINT "aset_sumber_instansi_check"
          CHECK ("instansi" IN ('BPN', 'BPKA', 'LAINNYA'));
        END IF;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'aset_reconciliation_aset_fkey'
            AND conrelid = 'aset_reconciliation'::regclass
        ) THEN
          ALTER TABLE "aset_reconciliation"
          ADD CONSTRAINT "aset_reconciliation_aset_fkey"
          FOREIGN KEY ("id_aset")
          REFERENCES "aset" ("id_aset")
          ON UPDATE CASCADE
          ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'aset_reconciliation_pusat_data_fkey'
            AND conrelid = 'aset_reconciliation'::regclass
        ) THEN
          ALTER TABLE "aset_reconciliation"
          ADD CONSTRAINT "aset_reconciliation_pusat_data_fkey"
          FOREIGN KEY ("id_pusat_data")
          REFERENCES "pusat_data" ("id_pusat_data")
          ON UPDATE CASCADE
          ON DELETE SET NULL;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'aset_reconciliation_reviewed_by_fkey'
            AND conrelid = 'aset_reconciliation'::regclass
        ) THEN
          ALTER TABLE "aset_reconciliation"
          ADD CONSTRAINT "aset_reconciliation_reviewed_by_fkey"
          FOREIGN KEY ("reviewed_by")
          REFERENCES "users" ("id_user")
          ON UPDATE CASCADE
          ON DELETE SET NULL;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'aset_reconciliation_status_check'
            AND conrelid = 'aset_reconciliation'::regclass
        ) THEN
          ALTER TABLE "aset_reconciliation"
          ADD CONSTRAINT "aset_reconciliation_status_check"
          CHECK ("status" IN (
            'belum_diperiksa',
            'cocok',
            'konflik',
            'terverifikasi',
            'ditolak'
          ));
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'aset_reconciliation_confidence_check'
            AND conrelid = 'aset_reconciliation'::regclass
        ) THEN
          ALTER TABLE "aset_reconciliation"
          ADD CONSTRAINT "aset_reconciliation_confidence_check"
          CHECK (
            "match_confidence" IS NULL
            OR ("match_confidence" >= 0 AND "match_confidence" <= 100)
          );
        END IF;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_aset_reconciliation_status_field"
      ON "aset" ("reconciliation_status");
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_aset_verified_by"
      ON "aset" ("verified_by");
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_aset_kode_aset_norm"
      ON "aset" (lower(regexp_replace(trim("kode_aset"), '[^a-zA-Z0-9]+', '', 'g')));
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_aset_nib_norm_not_null"
      ON "aset" (lower(regexp_replace(trim("nib"), '[^a-zA-Z0-9]+', '', 'g')))
      WHERE "nib" IS NOT NULL AND trim("nib") <> '';
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_aset_nomor_sertifikat_norm_not_null"
      ON "aset" (lower(regexp_replace(trim("nomor_sertifikat"), '[^a-zA-Z0-9]+', '', 'g')))
      WHERE "nomor_sertifikat" IS NOT NULL AND trim("nomor_sertifikat") <> '';
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_aset_nomor_hak_norm_not_null"
      ON "aset" (lower(regexp_replace(trim("nomor_hak"), '[^a-zA-Z0-9]+', '', 'g')))
      WHERE "nomor_hak" IS NOT NULL AND trim("nomor_hak") <> '';
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_pusat_data_kode_aset_norm"
      ON "pusat_data" (lower(regexp_replace(trim("kode_aset"), '[^a-zA-Z0-9]+', '', 'g')))
      WHERE "kode_aset" IS NOT NULL AND trim("kode_aset") <> '';
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_pusat_data_nib_norm_not_null"
      ON "pusat_data" (lower(regexp_replace(trim("nib"), '[^a-zA-Z0-9]+', '', 'g')))
      WHERE "nib" IS NOT NULL AND trim("nib") <> '';
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_pusat_data_nomor_hak_norm_not_null"
      ON "pusat_data" (lower(regexp_replace(trim("nomor_hak"), '[^a-zA-Z0-9]+', '', 'g')))
      WHERE "nomor_hak" IS NOT NULL AND trim("nomor_hak") <> '';
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_aset_sumber_aset"
      ON "aset_sumber" ("id_aset");
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_aset_sumber_instansi_aset"
      ON "aset_sumber" ("instansi", "id_aset");
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_aset_sumber_imported_by"
      ON "aset_sumber" ("imported_by");
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_aset_sumber_identifier"
      ON "aset_sumber" ("source_identifier")
      WHERE "source_identifier" IS NOT NULL;
    `);
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_aset_sumber_source_row"
      ON "aset_sumber" ("source_table", "source_id")
      WHERE "source_id" IS NOT NULL;
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_aset_reconciliation_aset_status"
      ON "aset_reconciliation" ("id_aset", "status");
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_aset_reconciliation_status"
      ON "aset_reconciliation" ("status");
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_aset_reconciliation_pusat_data"
      ON "aset_reconciliation" ("id_pusat_data");
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_aset_reconciliation_reviewed_by"
      ON "aset_reconciliation" ("reviewed_by");
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("aset_reconciliation");
    await queryInterface.dropTable("aset_sumber");

    await dropConstraintIfExists(queryInterface, "aset", "aset_verified_by_fkey");
    await dropConstraintIfExists(
      queryInterface,
      "aset",
      "aset_reconciliation_status_check",
    );

    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS "idx_aset_nomor_hak_norm_not_null";',
    );
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS "idx_aset_nomor_sertifikat_norm_not_null";',
    );
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS "idx_aset_nib_norm_not_null";',
    );
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "idx_aset_kode_aset_norm";');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "idx_aset_verified_by";');
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS "idx_aset_reconciliation_status_field";',
    );
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS "idx_pusat_data_kode_aset_norm";',
    );
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS "idx_pusat_data_nib_norm_not_null";',
    );
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS "idx_pusat_data_nomor_hak_norm_not_null";',
    );

    for (const columnName of Object.keys(asetColumns).reverse()) {
      await queryInterface.sequelize.query(`
        ALTER TABLE "aset" DROP COLUMN IF EXISTS "${columnName}";
      `);
    }
  },
};
