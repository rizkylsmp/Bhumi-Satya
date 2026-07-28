"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "aset_model_3d"
        ADD COLUMN IF NOT EXISTS "lod" VARCHAR(24)
    `);

    await queryInterface.sequelize.query(`
      UPDATE "aset_model_3d" AS model
      SET "lod" = COALESCE(
        NULLIF(UPPER(TRIM(asset."model_3d_lod")), ''),
        'LOD1'
      )
      FROM "aset" AS asset
      WHERE asset."id_aset" = model."id_aset"
    `);
    await queryInterface.sequelize.query(`
      UPDATE "aset_model_3d"
      SET "lod" = 'LOD1'
      WHERE "lod" IS NULL
    `);

    await queryInterface.changeColumn("aset_model_3d", "lod", {
      type: Sequelize.STRING(24),
      allowNull: false,
      defaultValue: "LOD1",
    });

    await queryInterface.sequelize.query(`
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
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "aset_model_3d_asset_lod_active_unique";
      ALTER TABLE "aset_model_3d"
        DROP CONSTRAINT IF EXISTS "aset_model_3d_asset_lod_version_unique";
    `);
    await queryInterface.sequelize.query(`
      WITH renumbered AS (
        SELECT
          "id_model_3d",
          ROW_NUMBER() OVER (
            PARTITION BY "id_aset"
            ORDER BY "created_at" ASC, "id_model_3d" ASC
          ) AS next_version
        FROM "aset_model_3d"
      )
      UPDATE "aset_model_3d" AS model
      SET "version" = renumbered.next_version
      FROM renumbered
      WHERE model."id_model_3d" = renumbered."id_model_3d"
    `);
    await queryInterface.addConstraint("aset_model_3d", {
      fields: ["id_aset", "version"],
      type: "unique",
      name: "aset_model_3d_asset_version_unique",
    });
    await queryInterface.removeColumn("aset_model_3d", "lod");
  },
};
