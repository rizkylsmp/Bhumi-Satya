"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable("aset_2d_catalog", {
        kode_2d: {
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
      }, { transaction });

      await queryInterface.sequelize.query(`
        INSERT INTO "aset_2d_catalog"
          ("kode_2d", "id_aset", "status", "created_at", "updated_at")
        SELECT
          '2D-' || LPAD("id_aset"::text, 6, '0'),
          "id_aset",
          'active',
          NOW(),
          NOW()
        FROM "aset"
        ON CONFLICT DO NOTHING;
      `, { transaction });

      await queryInterface.addColumn("aset_3d_catalog", "kode_2d", {
        type: Sequelize.STRING(40),
        allowNull: true,
      }, { transaction });
      await queryInterface.sequelize.query(`
        UPDATE "aset_3d_catalog" AS catalog
        SET "kode_2d" = parcel."kode_2d"
        FROM "aset_2d_catalog" AS parcel
        WHERE parcel."id_aset" = catalog."id_aset"
          AND catalog."kode_2d" IS NULL;

        DO $$
        DECLARE constraint_name TEXT;
        BEGIN
          FOR constraint_name IN
            SELECT con.conname
            FROM pg_constraint con
            JOIN pg_class rel ON rel.oid = con.conrelid
            JOIN pg_namespace ns ON ns.oid = rel.relnamespace
            WHERE rel.relname = 'aset_3d_catalog'
              AND ns.nspname = current_schema()
              AND con.contype = 'u'
              AND pg_get_constraintdef(con.oid) = 'UNIQUE (id_aset)'
          LOOP
            EXECUTE format('ALTER TABLE "aset_3d_catalog" DROP CONSTRAINT %I', constraint_name);
          END LOOP;
        END
        $$;
      `, { transaction });
      await queryInterface.changeColumn("aset_3d_catalog", "kode_2d", {
        type: Sequelize.STRING(40),
        allowNull: false,
        references: { model: "aset_2d_catalog", key: "kode_2d" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      }, { transaction });
      await queryInterface.addIndex("aset_3d_catalog", ["kode_2d"], {
        name: "aset_3d_catalog_kode_2d_idx",
        transaction,
      });

      await queryInterface.addColumn("aset_model_3d", "kode_3d", {
        type: Sequelize.STRING(40),
        allowNull: true,
      }, { transaction });
      await queryInterface.sequelize.query(`
        UPDATE "aset_model_3d" AS model
        SET "kode_3d" = catalog."kode_3d"
        FROM "aset_3d_catalog" AS catalog
        WHERE catalog."id_aset" = model."id_aset"
          AND model."kode_3d" IS NULL;

        ALTER TABLE "aset_model_3d"
          DROP CONSTRAINT IF EXISTS "aset_model_3d_asset_lod_version_unique";
        DROP INDEX IF EXISTS "aset_model_3d_asset_lod_active_unique";
      `, { transaction });
      await queryInterface.changeColumn("aset_model_3d", "kode_3d", {
        type: Sequelize.STRING(40),
        allowNull: false,
        references: { model: "aset_3d_catalog", key: "kode_3d" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      }, { transaction });
      await queryInterface.addConstraint("aset_model_3d", {
        fields: ["kode_3d", "lod", "version"],
        type: "unique",
        name: "aset_model_3d_catalog_lod_version_unique",
        transaction,
      });
      await queryInterface.sequelize.query(`
        CREATE UNIQUE INDEX "aset_model_3d_catalog_lod_active_unique"
          ON "aset_model_3d" ("kode_3d", "lod")
          WHERE "is_active" = TRUE AND "archived_at" IS NULL;
      `, { transaction });
      await queryInterface.addIndex("aset_model_3d", ["kode_3d"], {
        name: "aset_model_3d_kode_3d_idx",
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("aset_model_3d", "kode_3d");
    await queryInterface.removeColumn("aset_3d_catalog", "kode_2d");
    await queryInterface.dropTable("aset_2d_catalog");
  },
};
