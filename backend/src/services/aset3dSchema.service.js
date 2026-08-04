import sequelize from "../config/database.js";

const CREATE_CATALOG_SCHEMA_SQL = `
  ALTER TABLE "aset_model_3d"
    ADD COLUMN IF NOT EXISTS "lod" VARCHAR(24);

  UPDATE "aset_model_3d" AS model
  SET "lod" = COALESCE(
    NULLIF(UPPER(TRIM(asset."model_3d_lod")), ''),
    'LOD1'
  )
  FROM "aset" AS asset
  WHERE asset."id_aset" = model."id_aset"
    AND model."lod" IS NULL;

  UPDATE "aset_model_3d"
  SET "lod" = 'LOD1'
  WHERE "lod" IS NULL;

  ALTER TABLE "aset_model_3d"
    ALTER COLUMN "lod" SET DEFAULT 'LOD1',
    ALTER COLUMN "lod" SET NOT NULL;

  ALTER TABLE "aset_model_3d"
    DROP CONSTRAINT IF EXISTS "aset_model_3d_asset_version_unique";

  ALTER TABLE "aset_model_3d"
    ADD COLUMN IF NOT EXISTS "offset_x_m" DECIMAL(12, 3) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "offset_y_m" DECIMAL(12, 3) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "offset_z_m" DECIMAL(12, 3) NOT NULL DEFAULT 0;

  ALTER TABLE "aset_model_3d"
    ADD COLUMN IF NOT EXISTS "review_status" VARCHAR(24) NOT NULL DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS "review_notes" TEXT NULL,
    ADD COLUMN IF NOT EXISTS "reviewed_by" INTEGER NULL,
    ADD COLUMN IF NOT EXISTS "reviewed_at" TIMESTAMP WITH TIME ZONE NULL,
    ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP WITH TIME ZONE NULL,
    ADD COLUMN IF NOT EXISTS "source_data_type" VARCHAR(32) NULL,
    ADD COLUMN IF NOT EXISTS "source_crs" VARCHAR(32) NULL,
    ADD COLUMN IF NOT EXISTS "source_unit" VARCHAR(12) NULL,
    ADD COLUMN IF NOT EXISTS "source_origin_x" DECIMAL(18, 6) NULL,
    ADD COLUMN IF NOT EXISTS "source_origin_y" DECIMAL(18, 6) NULL,
    ADD COLUMN IF NOT EXISTS "source_origin_z" DECIMAL(18, 6) NULL,
    ADD COLUMN IF NOT EXISTS "quality_checklist" JSONB NOT NULL DEFAULT '{}'::jsonb;

  CREATE INDEX IF NOT EXISTS "aset_model_3d_review_status_idx"
    ON "aset_model_3d" ("review_status");

  CREATE TABLE IF NOT EXISTS "aset_2d_catalog" (
    "kode_2d" VARCHAR(40) PRIMARY KEY,
    "id_aset" INTEGER NOT NULL UNIQUE
      REFERENCES "aset" ("id_aset")
      ON UPDATE CASCADE
      ON DELETE CASCADE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );

  INSERT INTO "aset_2d_catalog"
    ("kode_2d", "id_aset", "status", "created_at", "updated_at")
  SELECT
    '2D-' || LPAD(aset."id_aset"::text, 6, '0'),
    aset."id_aset",
    'active',
    NOW(),
    NOW()
  FROM "aset" aset
  ON CONFLICT DO NOTHING;

  CREATE TABLE IF NOT EXISTS "aset_3d_catalog" (
    "kode_3d" VARCHAR(40) PRIMARY KEY,
    "id_aset" INTEGER NOT NULL
      REFERENCES "aset" ("id_aset")
      ON UPDATE CASCADE
      ON DELETE CASCADE,
    "kode_2d" VARCHAR(40) NOT NULL
      REFERENCES "aset_2d_catalog" ("kode_2d")
      ON UPDATE CASCADE
      ON DELETE CASCADE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_by" INTEGER NULL
      REFERENCES "users" ("id_user")
      ON UPDATE CASCADE
      ON DELETE SET NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS "aset_3d_catalog_status_idx"
    ON "aset_3d_catalog" ("status");
  CREATE INDEX IF NOT EXISTS "aset_3d_catalog_created_at_idx"
    ON "aset_3d_catalog" ("created_at");

  ALTER TABLE "aset_3d_catalog"
    ADD COLUMN IF NOT EXISTS "kode_2d" VARCHAR(40);

  UPDATE "aset_3d_catalog" AS catalog
  SET "kode_2d" = parcel."kode_2d"
  FROM "aset_2d_catalog" AS parcel
  WHERE parcel."id_aset" = catalog."id_aset"
    AND catalog."kode_2d" IS NULL;

  DO $$
  DECLARE constraint_name TEXT;
  BEGIN
    FOR constraint_name IN
      SELECT con.conname
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = rel.relnamespace
      WHERE rel.relname = 'aset_3d_catalog'
        AND ns.nspname = current_schema()
        AND con.contype = 'u'
        AND pg_get_constraintdef(con.oid) = 'UNIQUE (id_aset)'
    LOOP
      EXECUTE format('ALTER TABLE "aset_3d_catalog" DROP CONSTRAINT %I', constraint_name);
    END LOOP;
  END
  $$;

  ALTER TABLE "aset_3d_catalog"
    ALTER COLUMN "kode_2d" SET NOT NULL;

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'aset_3d_catalog_kode_2d_fkey'
    ) THEN
      ALTER TABLE "aset_3d_catalog"
        ADD CONSTRAINT "aset_3d_catalog_kode_2d_fkey"
        FOREIGN KEY ("kode_2d") REFERENCES "aset_2d_catalog" ("kode_2d")
        ON UPDATE CASCADE ON DELETE CASCADE;
    END IF;
  END
  $$;

  CREATE INDEX IF NOT EXISTS "aset_3d_catalog_kode_2d_idx"
    ON "aset_3d_catalog" ("kode_2d");

  CREATE TABLE IF NOT EXISTS "aset_model_3d_object" (
    "id_object_3d" UUID PRIMARY KEY,
    "id_model_3d" INTEGER NOT NULL
      REFERENCES "aset_model_3d" ("id_model_3d")
      ON UPDATE CASCADE
      ON DELETE CASCADE,
    "object_code" VARCHAR(120) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "category" VARCHAR(32) NOT NULL DEFAULT 'bangunan',
    "floor" VARCHAR(50) NULL,
    "usage" VARCHAR(150) NULL,
    "area_m2" DECIMAL(16, 3) NULL,
    "volume_m3" DECIMAL(18, 3) NULL,
    "height_m" DECIMAL(12, 3) NULL,
    "properties" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "created_by" INTEGER NULL,
    "updated_by" INTEGER NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );

  CREATE UNIQUE INDEX IF NOT EXISTS "model3d_object_code_unique"
    ON "aset_model_3d_object" ("id_model_3d", "object_code");
  CREATE INDEX IF NOT EXISTS "model3d_object_category_idx"
    ON "aset_model_3d_object" ("category");

  INSERT INTO "aset_3d_catalog"
    ("kode_3d", "id_aset", "kode_2d", "status", "created_by", "created_at", "updated_at")
  SELECT
    '3D-' || LPAD(aset."id_aset"::text, 6, '0'),
    aset."id_aset",
    parcel."kode_2d",
    'active',
    NULL,
    NOW(),
    NOW()
  FROM "aset" aset
  JOIN "aset_2d_catalog" parcel ON parcel."id_aset" = aset."id_aset"
  WHERE EXISTS (
    SELECT 1
    FROM "aset_model_3d" model
    WHERE model."id_aset" = aset."id_aset"
      AND model."archived_at" IS NULL
  )
  ON CONFLICT DO NOTHING;

  ALTER TABLE "aset_model_3d"
    ADD COLUMN IF NOT EXISTS "kode_3d" VARCHAR(40);

  UPDATE "aset_model_3d" AS model
  SET "kode_3d" = catalog."kode_3d"
  FROM "aset_3d_catalog" AS catalog
  WHERE catalog."id_aset" = model."id_aset"
    AND model."kode_3d" IS NULL;

  ALTER TABLE "aset_model_3d"
    ALTER COLUMN "kode_3d" SET NOT NULL,
    DROP CONSTRAINT IF EXISTS "aset_model_3d_asset_lod_version_unique";

  DROP INDEX IF EXISTS "aset_model_3d_asset_lod_active_unique";

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'aset_model_3d_catalog_fkey'
    ) THEN
      ALTER TABLE "aset_model_3d"
        ADD CONSTRAINT "aset_model_3d_catalog_fkey"
        FOREIGN KEY ("kode_3d") REFERENCES "aset_3d_catalog" ("kode_3d")
        ON UPDATE CASCADE ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'aset_model_3d_catalog_lod_version_unique'
    ) THEN
      ALTER TABLE "aset_model_3d"
        ADD CONSTRAINT "aset_model_3d_catalog_lod_version_unique"
        UNIQUE ("kode_3d", "lod", "version");
    END IF;
  END
  $$;

  CREATE UNIQUE INDEX IF NOT EXISTS "aset_model_3d_catalog_lod_active_unique"
    ON "aset_model_3d" ("kode_3d", "lod")
    WHERE "is_active" = TRUE AND "archived_at" IS NULL;
  CREATE INDEX IF NOT EXISTS "aset_model_3d_kode_3d_idx"
    ON "aset_model_3d" ("kode_3d");
`;

export const createAset3dSchemaInitializer = (database) => {
  let initializationPromise = null;

  return async () => {
    if (!initializationPromise) {
      initializationPromise = database
        .query(CREATE_CATALOG_SCHEMA_SQL)
        .catch((error) => {
          initializationPromise = null;
          throw error;
        });
    }
    await initializationPromise;
  };
};

export const ensureAset3dCatalogSchema =
  createAset3dSchemaInitializer(sequelize);

export const ensureAset3dCatalogSchemaMiddleware = async (req, res, next) => {
  try {
    await ensureAset3dCatalogSchema();
    next();
  } catch (error) {
    console.error("Gagal menyiapkan schema Kelola 3D:", error);
    res.status(503).json({
      success: false,
      message:
        "Database Kelola 3D belum siap. Jalankan migration database lalu coba kembali.",
    });
  }
};
