"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("aset", "kw", {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: "Kode Wilayah (KW) dari data BPN, misal KW1, KW2",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("aset", "kw");
  },
};
