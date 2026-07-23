"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("aset_3d_catalog", {
      kode_3d: {
        type: Sequelize.STRING(40),
        allowNull: false,
        primaryKey: true,
      },
      id_aset: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: "aset", key: "id_aset" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "active",
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "users", key: "id_user" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    await queryInterface.addIndex("aset_3d_catalog", ["status"], {
      name: "aset_3d_catalog_status_idx",
    });
    await queryInterface.addIndex("aset_3d_catalog", ["created_at"], {
      name: "aset_3d_catalog_created_at_idx",
    });

    // Aset yang sudah mempunyai model sebelum katalog dibuat tetap dianggap
    // sebagai aset Kelola 3D. Aset lain tidak dimasukkan secara otomatis.
    await queryInterface.sequelize.query(`
      INSERT INTO "aset_3d_catalog"
        ("kode_3d", "id_aset", "status", "created_by", "created_at", "updated_at")
      SELECT
        LEFT(
          '3D-' || REGEXP_REPLACE(
            UPPER(COALESCE(NULLIF(TRIM(aset."kode_aset"), ''), 'ASET')),
            '[^A-Z0-9]+',
            '-',
            'g'
          ),
          28
        ) || '-' || aset."id_aset",
        aset."id_aset",
        'active',
        NULL,
        NOW(),
        NOW()
      FROM "aset" aset
      WHERE EXISTS (
        SELECT 1
        FROM "aset_model_3d" model
        WHERE model."id_aset" = aset."id_aset"
          AND model."archived_at" IS NULL
      )
      ON CONFLICT DO NOTHING;
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("aset_3d_catalog");
  },
};
