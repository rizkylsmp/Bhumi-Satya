import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const AsetReconciliation = sequelize.define(
  "AsetReconciliation",
  {
    id_reconciliation: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_aset: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "aset",
        key: "id_aset",
      },
    },
    id_pusat_data: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "pusat_data",
        key: "id_pusat_data",
      },
      comment: "Kandidat sumber pusat_data pada masa transisi",
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "belum_diperiksa",
    },
    match_rule: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Aturan matching: nib, kode_aset, nomor_sertifikat, lokasi_luas, polygon",
    },
    match_confidence: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: "Skor keyakinan 0-100 untuk kandidat matching",
    },
    existing_values: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: "Snapshot nilai pada aset",
    },
    proposed_values: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: "Snapshot nilai dari sumber kandidat",
    },
    conflict_fields: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      comment: "Daftar field yang konflik",
    },
    resolution_values: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Nilai final yang dipilih reviewer",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reviewed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id_user",
      },
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "aset_reconciliation",
    timestamps: false,
  },
);

export default AsetReconciliation;
