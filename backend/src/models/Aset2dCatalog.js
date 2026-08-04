import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Aset2dCatalog = sequelize.define(
  "Aset2dCatalog",
  {
    kode_2d: {
      type: DataTypes.STRING(40),
      primaryKey: true,
      allowNull: false,
    },
    id_aset: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "active",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  { tableName: "aset_2d_catalog", timestamps: false },
);

export default Aset2dCatalog;
