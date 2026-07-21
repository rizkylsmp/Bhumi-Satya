import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Riwayat = sequelize.define(
  "Riwayat",
  {
    id_riwayat: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    aksi: {
      type: DataTypes.ENUM("CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT"),
      allowNull: false,
    },
    tabel: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    id_referensi: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    data_lama: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    data_baru: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    keterangan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    instansi_pelaku: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Instansi user ketika aktivitas dicatat",
    },
    changed_fields: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Daftar field yang berubah pada aksi UPDATE",
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id_user",
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "riwayat",
    timestamps: false,
  }
);

export default Riwayat;
