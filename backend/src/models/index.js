import sequelize from "../config/database.js";
import User from "./User.js";
import Aset from "./Aset.js";
import Riwayat from "./Riwayat.js";
import Notifikasi from "./Notifikasi.js";
import PusatData from "./PusatData.js";
import SewaAset from "./SewaAset.js";
import PermintaanSewa from "./PermintaanSewa.js";
import EkasmatResponse from "./EkasmatResponse.js";
import ChatMessage from "./ChatMessage.js";
import AsetSumber from "./AsetSumber.js";
import AsetReconciliation from "./AsetReconciliation.js";
import AsetModel3d from "./AsetModel3d.js";

// Define associations here to avoid circular dependencies
// User has many Aset (created_by)
User.hasMany(Aset, {
  foreignKey: "created_by",
  as: "assets",
});

// Aset belongs to User (creator)
Aset.belongsTo(User, {
  foreignKey: "created_by",
  as: "creator",
});

// Aset belongs to User (verifier)
Aset.belongsTo(User, {
  foreignKey: "verified_by",
  as: "verifier",
});

User.hasMany(Aset, {
  foreignKey: "verified_by",
  as: "verifiedAssets",
});

// User has many Riwayat
User.hasMany(Riwayat, {
  foreignKey: "user_id",
  as: "activities",
});

// Riwayat belongs to User
Riwayat.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

// User has many Notifikasi
User.hasMany(Notifikasi, {
  foreignKey: "user_id",
  as: "notifications",
});

// Notifikasi belongs to User
Notifikasi.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

// User has many PusatData (created_by)
User.hasMany(PusatData, {
  foreignKey: "created_by",
  as: "pusatData",
});

// PusatData belongs to User (creator)
PusatData.belongsTo(User, {
  foreignKey: "created_by",
  as: "creator",
});

// SewaAset belongs to Aset
SewaAset.belongsTo(Aset, {
  foreignKey: "id_aset",
  as: "aset",
});

Aset.hasMany(SewaAset, {
  foreignKey: "id_aset",
  as: "sewas",
});

// SewaAset belongs to User (creator)
SewaAset.belongsTo(User, {
  foreignKey: "created_by",
  as: "creator",
});

User.hasMany(SewaAset, {
  foreignKey: "created_by",
  as: "sewaAsets",
});

// PermintaanSewa belongs to SewaAset
PermintaanSewa.belongsTo(SewaAset, {
  foreignKey: "id_sewa",
  as: "sewa",
});

SewaAset.hasMany(PermintaanSewa, {
  foreignKey: "id_sewa",
  as: "permintaan",
});

// User has many ChatMessages
User.hasMany(ChatMessage, {
  foreignKey: "user_id",
  as: "chatMessages",
});

// ChatMessage belongs to User
ChatMessage.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

// Aset can have multiple provenance rows during integration
Aset.hasMany(AsetSumber, {
  foreignKey: "id_aset",
  as: "sources",
});

AsetSumber.belongsTo(Aset, {
  foreignKey: "id_aset",
  as: "aset",
});

AsetSumber.belongsTo(User, {
  foreignKey: "imported_by",
  as: "importer",
});

User.hasMany(AsetSumber, {
  foreignKey: "imported_by",
  as: "importedAssetSources",
});

// Reconciliation queue for candidate matches and merge conflicts
Aset.hasMany(AsetReconciliation, {
  foreignKey: "id_aset",
  as: "reconciliations",
});

AsetReconciliation.belongsTo(Aset, {
  foreignKey: "id_aset",
  as: "aset",
});

PusatData.hasMany(AsetReconciliation, {
  foreignKey: "id_pusat_data",
  as: "reconciliations",
});

AsetReconciliation.belongsTo(PusatData, {
  foreignKey: "id_pusat_data",
  as: "pusatData",
});

AsetReconciliation.belongsTo(User, {
  foreignKey: "reviewed_by",
  as: "reviewer",
});

User.hasMany(AsetReconciliation, {
  foreignKey: "reviewed_by",
  as: "reviewedReconciliations",
});

Aset.hasMany(AsetModel3d, {
  foreignKey: "id_aset",
  as: "models3d",
});

AsetModel3d.belongsTo(Aset, {
  foreignKey: "id_aset",
  as: "aset",
});

AsetModel3d.belongsTo(User, {
  foreignKey: "uploaded_by",
  as: "uploader",
});

User.hasMany(AsetModel3d, {
  foreignKey: "uploaded_by",
  as: "uploadedModels3d",
});

export {
  sequelize,
  User,
  Aset,
  Riwayat,
  Notifikasi,
  PusatData,
  SewaAset,
  PermintaanSewa,
  EkasmatResponse,
  ChatMessage,
  AsetSumber,
  AsetReconciliation,
  AsetModel3d,
};
