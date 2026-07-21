"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = {
      building_footprint: { type: Sequelize.JSON, allowNull: true },
      building_height_m: { type: Sequelize.DECIMAL(8, 2), allowNull: true },
      building_base_elevation_m: { type: Sequelize.DECIMAL(9, 2), allowNull: true },
      building_floors: { type: Sequelize.INTEGER, allowNull: true },
      building_height_source: { type: Sequelize.STRING(30), allowNull: true },
      building_height_quality: { type: Sequelize.STRING(20), allowNull: true },
      model_3d_lod: { type: Sequelize.STRING(10), allowNull: true },
      model_3d_source_crs: { type: Sequelize.STRING(32), allowNull: true },
      model_3d_recorded_at: { type: Sequelize.DATEONLY, allowNull: true },
      model_3d_accuracy_m: { type: Sequelize.DECIMAL(8, 3), allowNull: true },
    };
    for (const [name, definition] of Object.entries(columns)) {
      await queryInterface.addColumn("aset", name, definition);
    }
  },
  async down(queryInterface) {
    const columns = [
      "model_3d_accuracy_m", "model_3d_recorded_at", "model_3d_source_crs",
      "model_3d_lod", "building_height_quality", "building_height_source",
      "building_floors", "building_base_elevation_m", "building_height_m",
      "building_footprint",
    ];
    for (const name of columns) await queryInterface.removeColumn("aset", name);
  },
};

