"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = {
      conversion_status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "pending" },
      converted_storage_path: { type: Sequelize.TEXT, allowNull: true },
      converted_public_url: { type: Sequelize.TEXT, allowNull: true },
      converted_mime_type: { type: Sequelize.STRING(100), allowNull: true },
      converted_size_bytes: { type: Sequelize.BIGINT, allowNull: true },
      converted_checksum_sha256: { type: Sequelize.STRING(64), allowNull: true },
      converted_at: { type: Sequelize.DATE, allowNull: true },
      conversion_error: { type: Sequelize.TEXT, allowNull: true },
    };
    for (const [name, definition] of Object.entries(columns)) {
      await queryInterface.addColumn("aset_model_3d", name, definition);
    }
    await queryInterface.addIndex("aset_model_3d", ["conversion_status"], {
      name: "aset_model_3d_conversion_status_idx",
    });
  },
  async down(queryInterface) {
    await queryInterface.removeIndex("aset_model_3d", "aset_model_3d_conversion_status_idx");
    const columns = [
      "conversion_error",
      "converted_at",
      "converted_checksum_sha256",
      "converted_size_bytes",
      "converted_mime_type",
      "converted_public_url",
      "converted_storage_path",
      "conversion_status",
    ];
    for (const name of columns) await queryInterface.removeColumn("aset_model_3d", name);
  },
};

