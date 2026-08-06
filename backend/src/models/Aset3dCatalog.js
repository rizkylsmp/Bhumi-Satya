import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Aset3dCatalog = sequelize.define(
  "Aset3dCatalog",
  {
    kode_3d: {
      type: DataTypes.STRING(40),
      primaryKey: true,
      allowNull: false,
    },
    id_aset: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    kode_2d: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    building_name: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "active",
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
  { tableName: "aset_3d_catalog", timestamps: false },
);

export default Aset3dCatalog;
