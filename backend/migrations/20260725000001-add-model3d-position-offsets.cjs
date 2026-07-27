"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("aset_model_3d");
    const columns = {
      offset_x_m: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0,
      },
      offset_y_m: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0,
      },
      offset_z_m: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0,
      },
    };

    for (const [name, definition] of Object.entries(columns)) {
      if (!table[name]) {
        await queryInterface.addColumn("aset_model_3d", name, definition);
      }
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("aset_model_3d");
    for (const name of ["offset_z_m", "offset_y_m", "offset_x_m"]) {
      if (table[name]) await queryInterface.removeColumn("aset_model_3d", name);
    }
  },
};
