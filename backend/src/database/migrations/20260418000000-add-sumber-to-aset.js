/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    // 1. Tambahkan kolom sumber dengan default BPN
    await queryInterface.addColumn("aset", "sumber", {
      type: Sequelize.ENUM("BPN", "BPKA"),
      allowNull: false,
      defaultValue: "BPN",
    });

    // 2. Set sumber = BPKA untuk aset yang kode_aset-nya dimulai dengan BPKA-
    await queryInterface.sequelize.query(
      `UPDATE "aset" SET sumber = 'BPKA' WHERE kode_aset LIKE 'BPKA-%'`,
    );
  },

  async down(queryInterface, Sequelize) {
    // Drop enum type before dropping column in pure SQL if needed, but dropColumn usually suffices in Postgres/MySQL logic via sequelize
    await queryInterface.removeColumn("aset", "sumber");

    try {
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_aset_sumber";',
      );
    } catch (e) {
      // Ignore if type drop fails
    }
  },
};
