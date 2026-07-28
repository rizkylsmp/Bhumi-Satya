"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("aset_model_3d");
    const columns = {
      review_status: { type: Sequelize.STRING(24), allowNull: false, defaultValue: "draft" },
      review_notes: { type: Sequelize.TEXT, allowNull: true },
      reviewed_by: { type: Sequelize.INTEGER, allowNull: true },
      reviewed_at: { type: Sequelize.DATE, allowNull: true },
      expires_at: { type: Sequelize.DATE, allowNull: true },
      source_data_type: { type: Sequelize.STRING(32), allowNull: true },
      source_crs: { type: Sequelize.STRING(32), allowNull: true },
      source_unit: { type: Sequelize.STRING(12), allowNull: true },
      source_origin_x: { type: Sequelize.DECIMAL(18, 6), allowNull: true },
      source_origin_y: { type: Sequelize.DECIMAL(18, 6), allowNull: true },
      source_origin_z: { type: Sequelize.DECIMAL(18, 6), allowNull: true },
      quality_checklist: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
    };

    for (const [name, definition] of Object.entries(columns)) {
      if (!table[name]) await queryInterface.addColumn("aset_model_3d", name, definition);
    }

    await queryInterface.sequelize.query(`
      UPDATE "aset_model_3d"
      SET "review_status" = CASE
        WHEN "archived_at" IS NOT NULL THEN 'expired'
        WHEN "is_active" = TRUE AND "conversion_status" = 'ready' THEN 'active'
        WHEN "conversion_status" = 'ready' THEN 'verified'
        WHEN "conversion_status" = 'processing' THEN 'processing'
        ELSE 'draft'
      END;
    `);

    const indexes = await queryInterface.showIndex("aset_model_3d");
    if (!indexes.some((index) => index.name === "aset_model_3d_review_status_idx")) {
      await queryInterface.addIndex("aset_model_3d", ["review_status"], {
        name: "aset_model_3d_review_status_idx",
      });
    }
  },

  async down(queryInterface) {
    const indexes = await queryInterface.showIndex("aset_model_3d");
    if (indexes.some((index) => index.name === "aset_model_3d_review_status_idx")) {
      await queryInterface.removeIndex("aset_model_3d", "aset_model_3d_review_status_idx");
    }
    for (const column of [
      "quality_checklist",
      "source_origin_z",
      "source_origin_y",
      "source_origin_x",
      "source_unit",
      "source_crs",
      "source_data_type",
      "expires_at",
      "reviewed_at",
      "reviewed_by",
      "review_notes",
      "review_status",
    ]) {
      await queryInterface.removeColumn("aset_model_3d", column);
    }
  },
};
