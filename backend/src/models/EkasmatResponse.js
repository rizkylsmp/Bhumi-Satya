import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const EkasmatResponse = sequelize.define(
  "EkasmatResponse",
  {
    id_ekasmat: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nama: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    sumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "Umum",
    },
    skor: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    submitted_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "ekasmat_responses",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

export default EkasmatResponse;
