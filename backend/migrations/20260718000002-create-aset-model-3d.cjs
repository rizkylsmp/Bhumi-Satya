"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("aset_model_3d", {
      id_model_3d: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_aset: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "aset", key: "id_aset" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      version: { type: Sequelize.INTEGER, allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "ready" },
      format: { type: Sequelize.STRING(12), allowNull: false },
      original_name: { type: Sequelize.STRING(255), allowNull: false },
      storage_path: { type: Sequelize.TEXT, allowNull: false },
      public_url: { type: Sequelize.TEXT, allowNull: false },
      mime_type: { type: Sequelize.STRING(100), allowNull: false },
      file_size_bytes: { type: Sequelize.BIGINT, allowNull: false },
      checksum_sha256: { type: Sequelize.STRING(64), allowNull: false },
      kml_entry: { type: Sequelize.STRING(500), allowNull: true },
      model_entry: { type: Sequelize.STRING(500), allowNull: true },
      model_type: { type: Sequelize.STRING(12), allowNull: true },
      location_lat: { type: Sequelize.DECIMAL(10, 8), allowNull: true },
      location_long: { type: Sequelize.DECIMAL(11, 8), allowNull: true },
      altitude_m: { type: Sequelize.DECIMAL(10, 3), allowNull: true },
      altitude_mode: { type: Sequelize.STRING(40), allowNull: true },
      heading: { type: Sequelize.DECIMAL(10, 5), allowNull: true },
      tilt: { type: Sequelize.DECIMAL(10, 5), allowNull: true },
      roll: { type: Sequelize.DECIMAL(10, 5), allowNull: true },
      scale_x: { type: Sequelize.DECIMAL(12, 6), allowNull: true },
      scale_y: { type: Sequelize.DECIMAL(12, 6), allowNull: true },
      scale_z: { type: Sequelize.DECIMAL(12, 6), allowNull: true },
      entry_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      manifest: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      uploaded_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "users", key: "id_user" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      uploaded_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      archived_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addConstraint("aset_model_3d", {
      fields: ["id_aset", "version"],
      type: "unique",
      name: "aset_model_3d_asset_version_unique",
    });
    await queryInterface.addIndex("aset_model_3d", ["id_aset", "is_active"], {
      name: "aset_model_3d_asset_active_idx",
    });
    await queryInterface.addIndex("aset_model_3d", ["checksum_sha256"], {
      name: "aset_model_3d_checksum_idx",
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("aset_model_3d");
  },
};

