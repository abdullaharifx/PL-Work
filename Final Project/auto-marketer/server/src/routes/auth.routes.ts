import { Router } from "express";
import {
  initiateRedditAuth,
  handleRedditCallback,
  devLogin,
  getMyDetails,
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/dev-login", devLogin);
router.get("/reddit", initiateRedditAuth);
router.get("/reddit/callback", handleRedditCallback);

router.get("/reddit/me", requireAuth, getMyDetails);

export default router;
