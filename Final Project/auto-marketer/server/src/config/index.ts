import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/redit-outreach",
  },
  reddit: {
    clientId: process.env.REDDIT_CLIENT_ID || "",
    clientSecret: process.env.REDDIT_CLIENT_SECRET || "",
    redirectUri:
      process.env.REDDIT_REDIRECT_URI ||
      "http://localhost:3000/auth/reddit/callback",
    userAgent:
      process.env.REDDIT_USER_AGENT ||
      "outreach/1.0.0 by /u/Necessary-Chair731",
    authorizationEndpoint: "https://www.reddit.com/api/v1/authorize",
    tokenEndpoint: "https://www.reddit.com/api/v1/access_token",
    scope: "identity mysubreddits privatemessages read",
    frontendRedirectUrl:
      process.env.FRONTEND_REDIRECT_URL ||
      "http://localhost:3000/login/success",
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
  },
  chat_test: process.env.CHAT_TEST === "true",
} as const;

export type Config = typeof config;
