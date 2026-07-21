import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const PermintaanSewa = sequelize.define(
  "PermintaanSewa",
  {
    id_permintaan: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Linked sewa (optional, for reference)
    id_sewa: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "sewa_aset", key: "id_sewa" },
    },
    // Nama aset yang diminta
    nama_aset: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    // Pemohon
    nama_pemohon: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    nik: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    no_telepon: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    alamat: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pemohon_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "users", key: "id_user" },
    },
    pemohon_username: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    // Tujuan / keperluan sewa
    tujuan_sewa: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    // Status
    status: {
      type: DataTypes.ENUM("Baru", "Diproses", "Disetujui", "Ditolak"),
      defaultValue: "Baru",
    },
    catatan_admin: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Dokumen respon dari admin (array of URLs)
    dokumen_respon: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    tableName: "permintaan_sewa",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

export default PermintaanSewa;
