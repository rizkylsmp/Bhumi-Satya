"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("riwayat");

    if (!table.instansi_pelaku) {
      await queryInterface.addColumn("riwayat", "instansi_pelaku", {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: "Instansi user ketika aktivitas dicatat",
      });
    }

    if (!table.changed_fields) {
      await queryInterface.addColumn("riwayat", "changed_fields", {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: "Daftar field yang berubah; nilai lama dan baru ada di snapshot audit",
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("riwayat");

    if (table.changed_fields) {
      await queryInterface.removeColumn("riwayat", "changed_fields");
    }

    if (table.instansi_pelaku) {
      await queryInterface.removeColumn("riwayat", "instansi_pelaku");
    }
  },
};
