"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes("aset_model_3d_object")) {
      await queryInterface.createTable("aset_model_3d_object", {
        id_object_3d: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
        id_model_3d: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "aset_model_3d", key: "id_model_3d" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        object_code: { type: Sequelize.STRING(120), allowNull: false },
        name: { type: Sequelize.STRING(200), allowNull: false },
        category: { type: Sequelize.STRING(32), allowNull: false, defaultValue: "bangunan" },
        floor: { type: Sequelize.STRING(50), allowNull: true },
        usage: { type: Sequelize.STRING(150), allowNull: true },
        area_m2: { type: Sequelize.DECIMAL(16, 3), allowNull: true },
        volume_m3: { type: Sequelize.DECIMAL(18, 3), allowNull: true },
        height_m: { type: Sequelize.DECIMAL(12, 3), allowNull: true },
        properties: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: Sequelize.INTEGER, allowNull: true },
        updated_by: { type: Sequelize.INTEGER, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
    }
    const indexes = await queryInterface.showIndex("aset_model_3d_object");
    if (!indexes.some((index) => index.name === "model3d_object_code_unique")) {
      await queryInterface.addIndex("aset_model_3d_object", ["id_model_3d", "object_code"], {
        unique: true,
        name: "model3d_object_code_unique",
      });
    }
    if (!indexes.some((index) => index.name === "model3d_object_category_idx")) {
      await queryInterface.addIndex("aset_model_3d_object", ["category"], {
        name: "model3d_object_category_idx",
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable("aset_model_3d_object");
  },
};
