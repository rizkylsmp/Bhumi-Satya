"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = {
      converted_bounds: { type: Sequelize.JSONB, allowNull: true },
      converted_triangle_count: { type: Sequelize.BIGINT, allowNull: true },
      lod_medium_storage_path: { type: Sequelize.TEXT, allowNull: true },
      lod_medium_public_url: { type: Sequelize.TEXT, allowNull: true },
      lod_medium_size_bytes: { type: Sequelize.BIGINT, allowNull: true },
      lod_medium_checksum_sha256: { type: Sequelize.STRING(64), allowNull: true },
      lod_medium_triangle_count: { type: Sequelize.BIGINT, allowNull: true },
      lod_low_storage_path: { type: Sequelize.TEXT, allowNull: true },
      lod_low_public_url: { type: Sequelize.TEXT, allowNull: true },
      lod_low_size_bytes: { type: Sequelize.BIGINT, allowNull: true },
      lod_low_checksum_sha256: { type: Sequelize.STRING(64), allowNull: true },
      lod_low_triangle_count: { type: Sequelize.BIGINT, allowNull: true },
      optimized_at: { type: Sequelize.DATE, allowNull: true },
      optimization_error: { type: Sequelize.TEXT, allowNull: true },
    };
    for (const [name, definition] of Object.entries(columns)) {
      await queryInterface.addColumn("aset_model_3d", name, definition);
    }
  },

  async down(queryInterface) {
    const columns = [
      "optimization_error",
      "optimized_at",
      "lod_low_triangle_count",
      "lod_low_checksum_sha256",
      "lod_low_size_bytes",
      "lod_low_public_url",
      "lod_low_storage_path",
      "lod_medium_triangle_count",
      "lod_medium_checksum_sha256",
      "lod_medium_size_bytes",
      "lod_medium_public_url",
      "lod_medium_storage_path",
      "converted_triangle_count",
      "converted_bounds",
    ];
    for (const name of columns) await queryInterface.removeColumn("aset_model_3d", name);
  },
};
