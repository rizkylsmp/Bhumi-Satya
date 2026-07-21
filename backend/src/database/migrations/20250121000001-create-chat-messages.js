"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("chat_messages", {
      id_chat: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id_user",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      pesan: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      jawaban: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      kategori: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: "umum",
      },
      feedback: {
        type: Sequelize.ENUM("helpful", "not_helpful"),
        allowNull: true,
      },
      session_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex("chat_messages", ["user_id"]);
    await queryInterface.addIndex("chat_messages", ["session_id"]);
    await queryInterface.addIndex("chat_messages", ["created_at"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("chat_messages");
  },
};
