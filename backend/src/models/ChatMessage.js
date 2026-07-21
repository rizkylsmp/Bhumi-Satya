import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ChatMessage = sequelize.define(
  "ChatMessage",
  {
    id_chat: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // null for guest users
    },
    pesan: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    jawaban: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    kategori: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: "umum",
    },
    feedback: {
      type: DataTypes.ENUM("helpful", "not_helpful"),
      allowNull: true,
    },
    session_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    tableName: "chat_messages",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default ChatMessage;
