import { DataTypes } from "sequelize";

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface) {
  await queryInterface.addColumn("aset", "nib", {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: "Nomor Identifikasi Bidang dari WebGIS BPN/BPKA",
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("aset", "nib");
}
