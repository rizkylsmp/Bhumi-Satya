import sequelize from "../config/database.js";

const CREATE_CATALOG_SCHEMA_SQL = `
  ALTER TABLE "aset_model_3d"
    ADD COLUMN IF NOT EXISTS "offset_x_m" DECIMAL(12, 3) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "offset_y_m" DECIMAL(12, 3) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "offset_z_m" DECIMAL(12, 3) NOT NULL DEFAULT 0;

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
