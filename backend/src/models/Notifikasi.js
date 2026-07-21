import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Notifikasi = sequelize.define(
  "Notifikasi",
  {
    id_notifikasi: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id_user",
      },
    },
    judul: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    pesan: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    tipe: {
      type: DataTypes.ENUM("info", "warning", "success", "error"),
      defaultValue: "info",
    },
    kategori: {
      type: DataTypes.ENUM("aset", "user", "sistem", "riwayat"),
      defaultValue: "sistem",
    },
    referensi_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    referensi_tabel: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    dibaca: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    dibaca_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "notifikasi",
    timestamps: false,
  }
);

export default Notifikasi;
