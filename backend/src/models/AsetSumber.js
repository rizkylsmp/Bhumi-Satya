import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const AsetSumber = sequelize.define(
  "AsetSumber",
  {
    id_aset_sumber: {
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
    instansi: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: "Instansi asal data, misalnya BPN atau BPKA",
    },
    source_table: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "Tabel/sistem asal data, misalnya aset, pusat_data, webgis, excel",
    },
    source_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Primary key di sumber asal jika tersedia",
    },
    source_identifier: {
      type: DataTypes.STRING(150),
      allowNull: true,
      comment: "Identifier asal seperti kode bangunan, NIB, atau nomor hak",
    },
    import_batch: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Nama batch impor/migrasi",
    },
    reference_values: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: "Snapshot nilai referensi dari sumber asal",
    },
    imported_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    imported_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id_user",
      },
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
    tableName: "aset_sumber",
    timestamps: false,
  },
);

export default AsetSumber;
