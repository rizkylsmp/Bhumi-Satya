"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("orthophotos", {
      id_orthophoto: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      name: { type: Sequelize.STRING(160), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      source: { type: Sequelize.STRING(160), allowNull: true },
      acquisition_date: { type: Sequelize.DATEONLY, allowNull: true },
      source_crs: { type: Sequelize.STRING(64), allowNull: false },
      bounds_west: { type: Sequelize.DECIMAL(14, 10), allowNull: false },
      bounds_south: { type: Sequelize.DECIMAL(14, 10), allowNull: false },
      bounds_east: { type: Sequelize.DECIMAL(14, 10), allowNull: false },
      bounds_north: { type: Sequelize.DECIMAL(14, 10), allowNull: false },
      original_name: { type: Sequelize.STRING(255), allowNull: false },
      storage_path: { type: Sequelize.TEXT, allowNull: false },
      public_url: { type: Sequelize.TEXT, allowNull: false },
      preview_storage_path: { type: Sequelize.TEXT, allowNull: false },
      preview_public_url: { type: Sequelize.TEXT, allowNull: false },
      mime_type: { type: Sequelize.STRING(100), allowNull: false },
      file_size_bytes: { type: Sequelize.BIGINT, allowNull: false },
      raster_width: { type: Sequelize.INTEGER, allowNull: true },
      raster_height: { type: Sequelize.INTEGER, allowNull: true },
      related_kode_2d: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "draft",
      },
      opacity: {
        type: Sequelize.DECIMAL(4, 3),
        allowNull: false,
        defaultValue: 1,
      },
      created_by: { type: Sequelize.INTEGER, allowNull: true },
      published_at: { type: Sequelize.DATE, allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
    await queryInterface.addIndex("orthophotos", ["status"]);
    await queryInterface.addIndex("orthophotos", ["acquisition_date"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("orthophotos");
  },
};
