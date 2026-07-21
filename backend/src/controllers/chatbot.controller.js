import ChatMessage from "../models/ChatMessage.js";
import chatbotService from "../services/chatbot.service.js";

/**
 * Send message to chatbot and get response
 * POST /api/chatbot/chat
 */
export const sendMessage = async (req, res) => {
  try {
    const { pesan, session_id } = req.body;
    const user_id = req.user?.id || null;

    if (!pesan || !session_id) {
      return res.status(400).json({
        success: false,
        error: "Pesan dan session_id wajib diisi",
      });
    }

    // Get bot response from service
    const botResponse = chatbotService.findResponse(pesan);

    // Keep help available even when history storage is temporarily unavailable.
    let chatMessage = null;
    try {
      chatMessage = await ChatMessage.create({
        user_id,
        pesan,
        jawaban: botResponse.jawaban,
        kategori: botResponse.kategori,
        session_id,
      });
    } catch (storageError) {
      console.error("Chatbot history storage error:", storageError.message);
    }

    // Get quick replies for the response
    const quickReplies = chatbotService.getQuickReplies(botResponse.kategori);

    res.json({
      success: true,
      data: {
        id_chat: chatMessage?.id_chat || null,
        jawaban: botResponse.jawaban,
        kategori: botResponse.kategori,
        quickReplies,
        created_at: chatMessage?.created_at || new Date(),
      },
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get chat history for current session
 * GET /api/chatbot/history
 */
export const getHistory = async (req, res) => {
  try {
    const { session_id } = req.query;
    const user_id = req.user?.id || null;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        error: "session_id wajib diisi",
      });
    }

    const where = { session_id };
    if (user_id) {
      where.user_id = user_id;
    }

    const messages = await ChatMessage.findAll({
      where,
      order: [["created_at", "ASC"]],
      limit: 50,
    });

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Chatbot history error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Submit feedback for a chat message
 * PUT /api/chatbot/:id/feedback
 */
export const submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    if (!["helpful", "not_helpful"].includes(feedback)) {
      return res.status(400).json({
        success: false,
        error: "Feedback harus 'helpful' atau 'not_helpful'",
      });
    }

    const chatMessage = await ChatMessage.findByPk(id);
    if (!chatMessage) {
      return res.status(404).json({
        success: false,
        error: "Chat message tidak ditemukan",
      });
    }

    chatMessage.feedback = feedback;
    await chatMessage.save();

    res.json({
      success: true,
      message: "Feedback berhasil disimpan",
    });
  } catch (error) {
    console.error("Chatbot feedback error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get suggested questions for quick access
 * GET /api/chatbot/suggestions
 */
export const getSuggestions = async (req, res) => {
  try {
    const suggestions = chatbotService.getSuggestedQuestions();

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error("Chatbot suggestions error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Clear chat history for current session
 * DELETE /api/chatbot/clear
 */
export const clearHistory = async (req, res) => {
  try {
    const { session_id } = req.query;
    const user_id = req.user?.id || null;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        error: "session_id wajib diisi",
      });
    }

    const where = { session_id };
    if (user_id) {
      where.user_id = user_id;
    }

    await ChatMessage.destroy({ where });

    res.json({
      success: true,
      message: "Riwayat chat berhasil dihapus",
    });
  } catch (error) {
    console.error("Chatbot clear error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
