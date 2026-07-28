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

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'aset_model_3d_asset_lod_version_unique'
    ) THEN
      ALTER TABLE "aset_model_3d"
        ADD CONSTRAINT "aset_model_3d_asset_lod_version_unique"
        UNIQUE ("id_aset", "lod", "version");
    END IF;
  END
  $$;

  WITH ranked_active AS (
    SELECT
      "id_model_3d",
      ROW_NUMBER() OVER (
        PARTITION BY "id_aset", "lod"
        ORDER BY "version" DESC, "id_model_3d" DESC
      ) AS active_rank
    FROM "aset_model_3d"
    WHERE "is_active" = TRUE AND "archived_at" IS NULL
  )
  UPDATE "aset_model_3d" AS model
  SET "is_active" = FALSE
  FROM ranked_active
  WHERE model."id_model_3d" = ranked_active."id_model_3d"
    AND ranked_active.active_rank > 1;

  CREATE UNIQUE INDEX IF NOT EXISTS "aset_model_3d_asset_lod_active_unique"
    ON "aset_model_3d" ("id_aset", "lod")
    WHERE "is_active" = TRUE AND "archived_at" IS NULL;

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

  CREATE TABLE IF NOT EXISTS "aset_3d_catalog" (
    "kode_3d" VARCHAR(40) PRIMARY KEY,
    "id_aset" INTEGER NOT NULL UNIQUE
      REFERENCES "aset" ("id_aset")
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

  UPDATE "aset_3d_catalog"
  SET "kode_3d" = 'TMP3D-' || "id_aset"
  WHERE "kode_3d" <> '3D-' || LPAD("id_aset"::text, 6, '0');

  UPDATE "aset_3d_catalog"
  SET
    "kode_3d" = '3D-' || LPAD("id_aset"::text, 6, '0'),
    "updated_at" = NOW()
  WHERE "kode_3d" LIKE 'TMP3D-%';

  INSERT INTO "aset_3d_catalog"
    ("kode_3d", "id_aset", "status", "created_by", "created_at", "updated_at")
  SELECT
    '3D-' || LPAD(aset."id_aset"::text, 6, '0'),
    aset."id_aset",
    'active',
    NULL,
    NOW(),
    NOW()
  FROM "aset" aset
  WHERE EXISTS (
    SELECT 1
    FROM "aset_model_3d" model
    WHERE model."id_aset" = aset."id_aset"
      AND model."archived_at" IS NULL
  )
  ON CONFLICT DO NOTHING;
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
