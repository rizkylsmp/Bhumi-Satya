"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("aset_3d_catalog");
    if (!table.building_name) {
      await queryInterface.addColumn("aset_3d_catalog", "building_name", {
        type: Sequelize.STRING(150),
        allowNull: true,
      });
    }

    await queryInterface.sequelize.query(`
      UPDATE "aset_3d_catalog" AS catalog
      SET "building_name" = (
        SELECT NULLIF(BTRIM(model."manifest"->>'display_name'), '') AS "display_name"
        FROM "aset_model_3d" AS model
        WHERE model."kode_3d" = catalog."kode_3d"
          AND model."archived_at" IS NULL
          AND model."status" <> 'archived'
          AND NULLIF(BTRIM(model."manifest"->>'display_name'), '') IS NOT NULL
        ORDER BY model."is_active" DESC, model."updated_at" DESC
        LIMIT 1
      )
      WHERE catalog."building_name" IS NULL
        AND EXISTS (
          SELECT 1
          FROM "aset_model_3d" AS named_model
          WHERE named_model."kode_3d" = catalog."kode_3d"
            AND named_model."archived_at" IS NULL
            AND named_model."status" <> 'archived'
            AND NULLIF(BTRIM(named_model."manifest"->>'display_name'), '') IS NOT NULL
        );

    `);
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("aset_3d_catalog");
    if (table.building_name) {
      await queryInterface.removeColumn("aset_3d_catalog", "building_name");
    }
  },
};
