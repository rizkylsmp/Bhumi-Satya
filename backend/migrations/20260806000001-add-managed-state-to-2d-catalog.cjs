"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("aset_2d_catalog");
    if (!table.is_managed) {
      await queryInterface.addColumn("aset_2d_catalog", "is_managed", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    await queryInterface.sequelize.query(`
      UPDATE "aset_2d_catalog" AS parcel
      SET "is_managed" = TRUE
      FROM "aset" AS asset
      WHERE asset."id_aset" = parcel."id_aset"
        AND (
          (
            asset."koordinat_lat" IS NOT NULL
            AND asset."koordinat_long" IS NOT NULL
          )
          OR (
            asset."polygon_bidang" IS NOT NULL
            AND asset."polygon_bidang"::text NOT IN ('null', '""', '[]', '{}')
          )
          OR EXISTS (
            SELECT 1
            FROM "aset_3d_catalog" AS building
            WHERE building."kode_2d" = parcel."kode_2d"
          )
        );
    `);
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("aset_2d_catalog");
    if (table.is_managed) {
      await queryInterface.removeColumn("aset_2d_catalog", "is_managed");
    }
  },
};
