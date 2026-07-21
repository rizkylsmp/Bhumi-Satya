import { DataTypes } from "sequelize";

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("aset", "kecamatan", {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: "Kecamatan",
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("aset", "kecamatan");
}
