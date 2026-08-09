"use strict";

const TARGET_ASSET_CODE = "1.3.1.01.01.04.001";

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `
        UPDATE "aset"
        SET
          "kecamatan" = NULL,
          "desa_kelurahan" = NULL,
          "updated_at" = CURRENT_TIMESTAMP
        WHERE "kode_aset" = :assetCode
          AND LOWER(BTRIM(COALESCE("kecamatan", ''))) = 'bugul kidul'
          AND LOWER(BTRIM(COALESCE("desa_kelurahan", ''))) = 'bakalan'
      `,
      { replacements: { assetCode: TARGET_ASSET_CODE } },
    );
  },

  // This is an invalid legacy location correction. Restoring the incorrect
  // Pasuruan values during rollback would reintroduce the data issue.
  async down() {},
};
