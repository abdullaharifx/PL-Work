import { Router } from "express";
import {
  startChat,
  sendMessage,
  getOutreachChats,
  getRedditMessagesTest,
} from "../controllers/chat.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Protect all routes
router.use(requireAuth);

// Start a new chat with a post author
router.post("/outreach/:outreachId/post/:postId/start", startChat);

// Send a message in an existing chat
// router.post("/:chatId/message", sendMessage);

// Get all chats for an outreach
router.get("/outreach/:outreachId", getOutreachChats);

// ! TEST ROUTE: Get Reddit messages
// router.get("/reddit/messages", getRedditMessagesTest);

export default router;
