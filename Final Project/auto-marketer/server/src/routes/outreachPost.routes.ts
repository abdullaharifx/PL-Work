import { Router } from "express";
import {
  getAllOutreachPosts,
  getRelevantOutreachPosts,
} from "../controllers/outreachPost.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Protect all routes
router.use(requireAuth);

// Get all posts for a specific outreach
router.get("/:id/posts", getAllOutreachPosts);

// Get relevant posts for a specific outreach
router.get("/:id/posts/relevant", getRelevantOutreachPosts);

export default router;
