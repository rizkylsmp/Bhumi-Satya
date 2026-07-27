"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE "aset_3d_catalog"
      SET "kode_3d" = 'TMP3D-' || "id_aset"
      WHERE "kode_3d" <> '3D-' || LPAD("id_aset"::text, 6, '0');

      UPDATE "aset_3d_catalog"
      SET
        "kode_3d" = '3D-' || LPAD("id_aset"::text, 6, '0'),
        "updated_at" = NOW()
      WHERE "kode_3d" LIKE 'TMP3D-%';
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE "aset_3d_catalog" catalog
      SET
        "kode_3d" = LEFT(
          '3D-' || REGEXP_REPLACE(
            UPPER(COALESCE(NULLIF(TRIM(aset."kode_aset"), ''), 'ASET')),
            '[^A-Z0-9]+',
            '-',
            'g'
          ),
          28
        ) || '-' || catalog."id_aset",
        "updated_at" = NOW()
      FROM "aset" aset
      WHERE aset."id_aset" = catalog."id_aset";
    `);
  },
};
