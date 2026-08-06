import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Orthophoto = sequelize.define(
  "Orthophoto",
  {
    id_orthophoto: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    source: { type: DataTypes.STRING(160), allowNull: true },
    acquisition_date: { type: DataTypes.DATEONLY, allowNull: true },
    source_crs: { type: DataTypes.STRING(64), allowNull: false },
    bounds_west: { type: DataTypes.DECIMAL(14, 10), allowNull: false },
    bounds_south: { type: DataTypes.DECIMAL(14, 10), allowNull: false },
    bounds_east: { type: DataTypes.DECIMAL(14, 10), allowNull: false },
    bounds_north: { type: DataTypes.DECIMAL(14, 10), allowNull: false },
    original_name: { type: DataTypes.STRING(255), allowNull: false },
    storage_path: { type: DataTypes.TEXT, allowNull: false },
    public_url: { type: DataTypes.TEXT, allowNull: false },
    preview_storage_path: { type: DataTypes.TEXT, allowNull: false },
    preview_public_url: { type: DataTypes.TEXT, allowNull: false },
    mime_type: { type: DataTypes.STRING(100), allowNull: false },
    file_size_bytes: { type: DataTypes.BIGINT, allowNull: false },
    raster_width: { type: DataTypes.INTEGER, allowNull: true },
    raster_height: { type: DataTypes.INTEGER, allowNull: true },
    related_kode_2d: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "draft" },
    opacity: { type: DataTypes.DECIMAL(4, 3), allowNull: false, defaultValue: 1 },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
    published_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { tableName: "orthophotos", timestamps: false },
);

export default Orthophoto;
