import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const AsetModel3dObject = sequelize.define("AsetModel3dObject", {
  id_object_3d: {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
  },
  id_model_3d: { type: DataTypes.INTEGER, allowNull: false },
  object_code: { type: DataTypes.STRING(120), allowNull: false },
  name: { type: DataTypes.STRING(200), allowNull: false },
  category: { type: DataTypes.STRING(32), allowNull: false, defaultValue: "bangunan" },
  floor: { type: DataTypes.STRING(50), allowNull: true },
  usage: { type: DataTypes.STRING(150), allowNull: true },
  area_m2: { type: DataTypes.DECIMAL(16, 3), allowNull: true },
  volume_m3: { type: DataTypes.DECIMAL(18, 3), allowNull: true },
  height_m: { type: DataTypes.DECIMAL(12, 3), allowNull: true },
  properties: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  created_by: { type: DataTypes.INTEGER, allowNull: true },
  updated_by: { type: DataTypes.INTEGER, allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: "aset_model_3d_object",
  timestamps: false,
  indexes: [
    { unique: true, fields: ["id_model_3d", "object_code"], name: "model3d_object_code_unique" },
  ],
});

export default AsetModel3dObject;
