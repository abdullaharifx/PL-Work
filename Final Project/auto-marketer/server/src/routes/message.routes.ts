import { Router } from "express";
import { 
  generateMessages, 
  saveGeneratedMessage, 
  executeOutreach 
} from "../controllers/message.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Generate messages for specific posts
router.post("/:outreachId/generate", generateMessages);

// Save/approve a generated message
router.post("/save", saveGeneratedMessage);

// Execute outreach (manual or automatic)
router.post("/:outreachId/execute", executeOutreach);

export default router;
