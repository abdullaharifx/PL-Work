import { NextFunction, Request, Response } from "express";
import { AppError } from "../middleware/error.middleware";
import Post from "../models/Post";
import Chat from "../models/Chat";
import { Types } from "mongoose";
import ChatService from "../utils/chatService";
import Outreach from "../models/Outreach";
import { IProduct } from "../models/Product";
import snoowrap from "snoowrap";
import { config } from "../config";

// Start a new chat with a post author
export const startChat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { postId, outreachId } = req.params;

    // Validate postId and outreachId
    if (
      !Types.ObjectId.isValid(postId) ||
      !Types.ObjectId.isValid(outreachId)
    ) {
      return next(new AppError("Invalid post or outreach ID", 400));
    }

    // Find the post and verify it belongs to the user's outreach
    const post = await Post.findOne({
      _id: postId,
      outreach: outreachId,
    });

    if (!post) {
      return next(
        new AppError("Post not found or not associated with this outreach", 404)
      );
    }

    // Check if a chat already exists for this post
    const existingChat = await Chat.findOne({
      redditPostId: post.post_id,
      outreach: outreachId,
    });

    if (existingChat) {
      return next(new AppError("A chat already exists for this post", 400));
    }

    // Initialize chat service with user's Reddit access token
    const chatService = new ChatService(req.user.redditAccessToken);

    // Get the product information from the outreach
    const outreach = await Outreach.findById(outreachId).populate("product");

    if (!outreach) {
      return next(new AppError("Outreach not found", 404));
    }

    if (!outreach.product) {
      return next(
        new AppError("No product associated with this outreach", 400)
      );
    }

    // Start the chat with AI-generated message
    const chat = await chatService.startAIChat(
      post,
      req.user,
      outreach.product as IProduct,
      new Types.ObjectId(outreachId)
    );

    res.status(201).json({
      status: "success",
      data: chat,
    });
  } catch (error) {
    next(error);
  }
};

// Send a message in an existing chat
export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { chatId } = req.params;
    const { message } = req.body;

    if (!message) {
      return next(new AppError("Message content is required", 400));
    }

    // Find the chat and verify ownership
    const chat = await Chat.findOne({
      _id: chatId,
      user: req.user._id,
    });

    if (!chat) {
      return next(
        new AppError("Chat not found or you don't have permission", 404)
      );
    }

    // Initialize chat service with user's Reddit access token
    const chatService = new ChatService(req.user.redditAccessToken);

    // Send the message to Reddit
    const messageId = await chatService.reddit.sendDM(
      chat.authorUsername,
      `Re: ${chat.redditPostId}`,
      message
    );

    // Add the message to the conversation
    chat.conversation.push({
      content: message,
      sender: "USER",
      redditMessageId: messageId,
      sentAt: new Date(),
    });

    await chat.save();

    res.status(200).json({
      status: "success",
      data: chat,
    });
  } catch (error) {
    next(error);
  }
};

// Get all chats for an outreach
export const getOutreachChats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { outreachId } = req.params;

    const chats = await Chat.find({
      outreach: outreachId,
      user: req.user._id,
    }).sort({ "initialMessage.sentAt": -1 });

    res.status(200).json({
      status: "success",
      results: chats.length,
      data: chats,
    });
  } catch (error) {
    next(error);
  }
};

export const getRedditMessagesTest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // const chatService = new ChatService(req.user.redditAccessToken);

  // const messages = await chatService.reddit.getMessages();

  const redditClient = new snoowrap({
    userAgent: config.reddit.userAgent,
    accessToken: req.user.redditAccessToken,
  });

  const messages = await redditClient.getSentMessages();

  res.status(200).json({
    status: "success",
    data: {
      messages,
    },
  });
};
