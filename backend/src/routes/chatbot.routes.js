import express from "express";
import * as ChatbotController from "../controllers/chatbot.controller.js";

const router = express.Router();

// All routes are public - chatbot accessible before login
router.get("/suggestions", ChatbotController.getSuggestions);
router.post("/chat", ChatbotController.sendMessage);
router.get("/history", ChatbotController.getHistory);
router.put("/:id/feedback", ChatbotController.submitFeedback);
router.delete("/clear", ChatbotController.clearHistory);

export default router;
