import { DataTypes } from "sequelize";

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface) {
  const table = await queryInterface.describeTable("permintaan_sewa");

  if (!table.catatan_admin) {
    await queryInterface.addColumn("permintaan_sewa", "catatan_admin", {
      type: DataTypes.TEXT,
      allowNull: true,
    });
  }

  if (!table.dokumen_respon) {
    await queryInterface.addColumn("permintaan_sewa", "dokumen_respon", {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    });
  }
}

export async function down(queryInterface) {
  const table = await queryInterface.describeTable("permintaan_sewa");

  if (table.dokumen_respon) {
    await queryInterface.removeColumn("permintaan_sewa", "dokumen_respon");
  }

  if (table.catatan_admin) {
    await queryInterface.removeColumn("permintaan_sewa", "catatan_admin");
  }
}
