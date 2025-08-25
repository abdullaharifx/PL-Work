import express, { Express, Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import session from "express-session";
import { config } from "./config";
import authRoutes from "./routes/auth.routes";
import MongoStore from "connect-mongo";
import { errorHandler, AppError } from "./middleware/error.middleware";
import productRoutes from "./routes/product.routes";
import outreachRoutes from "./routes/outreach.routes";
import outreachPostRoutes from "./routes/outreachPost.routes";
import chatRoutes from "./routes/chat.routes";
import messageRoutes from "./routes/message.routes";

declare module "express-session" {
  interface SessionData {
    oauthState?: string;
    userId?: string;
  }
}

const app: Express = express();

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: config.mongodb.uri }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// MongoDB Connection
mongoose
  .connect(config.mongodb.uri)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

// Routes
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/outreach", outreachRoutes);
app.use("/outreach-posts", outreachPostRoutes);
app.use("/chats", chatRoutes);
app.use("/messages", messageRoutes);

// Basic route
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Welcome to Reddit Outreach API" });
});

// Not found route
app.use((req: Request, res: Response, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});
