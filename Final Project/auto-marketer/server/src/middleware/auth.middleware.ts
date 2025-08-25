import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import { refreshRedditToken } from "../controllers/auth.controller";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const user = await User.findById(req.session.userId).select(
      "+redditAccessToken +redditTokenExpiresAt"
    );

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Check if token needs refresh
    if (user.redditTokenExpiresAt && user.redditTokenExpiresAt <= new Date()) {
      try {
        await refreshRedditToken(user._id as string);
      } catch (error) {
        return res.status(401).json({ error: "Token refresh failed" });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
