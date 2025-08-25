import { Request, Response, NextFunction } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config";
import Post, { IPost } from "../models/Post";
import Outreach, { IOutreach } from "../models/Outreach";
import { IProduct } from "../models/Product";

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

export interface GeneratedMessage {
  postId: string;
  originalText: string;
  generatedReply: string;
  replyType: "comment" | "direct_message";
  confidence: number;
  reasoning: string;
}

export const generateMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { outreachId } = req.params;
    const { postIds } = req.body; // Array of post IDs to generate messages for

    // Fetch outreach and posts
    const outreach = await Outreach.findById(outreachId).populate("product") as IOutreach & { product: IProduct };
    if (!outreach) {
      return res.status(404).json({ error: "Outreach not found" });
    }

    const posts = await Post.find({
      _id: { $in: postIds },
      outreachId: outreachId,
      canSolve: true, // Only generate messages for relevant posts
    }) as IPost[];

    if (posts.length === 0) {
      return res.status(400).json({ error: "No valid posts found" });
    }

    const generatedMessages: GeneratedMessage[] = [];

    // Generate messages for each post
    for (const post of posts) {
      try {
        const prompt = `
You are a helpful marketing assistant. Generate a personalized, non-spammy reply for this Reddit post.

PRODUCT INFORMATION:
Name: ${outreach.product.name}
Description: ${outreach.product.description}
Target Audience: ${outreach.product.targetAudience}
Value Proposition: ${outreach.product.valueProposition}

REDDIT POST:
Title: ${post.title}
Content: ${post.text}
Subreddit: ${post.subreddit}
Author: ${post.author}

REQUIREMENTS:
1. Be helpful and genuinely useful
2. Don't be salesy or pushy
3. Provide value first before mentioning the product
4. Keep it natural and conversational
5. Max 150 words
6. Include a subtle mention of the product if relevant
7. Be respectful of Reddit's community guidelines

Generate a reply that would be well-received by the Reddit community.
`;

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const generatedReply = result.response.text();

        generatedMessages.push({
          postId: (post._id as any).toString(),
          originalText: post.text,
          generatedReply: generatedReply.trim(),
          replyType: post.subreddit.includes("DMs") ? "direct_message" : "comment",
          confidence: 0.8, // You could implement confidence scoring
          reasoning: `Generated personalized response for ${post.subreddit} post about ${post.title}`,
        });
      } catch (error) {
        console.error(`Error generating message for post ${(post._id as any).toString()}:`, error);
        // Continue with other posts even if one fails
      }
    }

    res.status(200).json({
      status: "success",
      data: {
        outreachId,
        messages: generatedMessages,
        generatedCount: generatedMessages.length,
        requestedCount: postIds.length,
      },
    });
  } catch (error) {
    console.error("Message generation error:", error);
    next(error);
  }
};

export const saveGeneratedMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { postId, message, approved } = req.body;

    const post = await Post.findById(postId) as IPost;
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Save the generated message to the post
    post.generatedMessage = message;
    post.messageApproved = approved;
    post.messageGeneratedAt = new Date();
    await post.save();

    res.status(200).json({
      status: "success",
      data: { postId, saved: true },
    });
  } catch (error) {
    next(error);
  }
};

export const executeOutreach = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { outreachId } = req.params;
    const { postIds, executionType } = req.body; // executionType: 'manual' | 'automatic'

    const posts = await Post.find({
      _id: { $in: postIds },
      outreachId: outreachId,
      messageApproved: true,
    }) as IPost[];

    if (posts.length === 0) {
      return res.status(400).json({ 
        error: "No approved messages found for execution" 
      });
    }

    if (executionType === "automatic") {
      // TODO: Implement automatic posting to Reddit
      // This would require Reddit API integration for posting comments
      // For now, we'll mark them as "scheduled"
      
      await Post.updateMany(
        { _id: { $in: postIds } },
        { 
          messageStatus: "scheduled",
          scheduledAt: new Date(),
        }
      );

      res.status(200).json({
        status: "success",
        data: {
          message: "Messages scheduled for automatic posting",
          scheduledCount: posts.length,
        },
      });
    } else {
      // Manual execution - just mark as ready for manual posting
      await Post.updateMany(
        { _id: { $in: postIds } },
        { 
          messageStatus: "ready_for_manual",
          readyAt: new Date(),
        }
      );

      res.status(200).json({
        status: "success",
        data: {
          message: "Messages ready for manual posting",
          readyCount: posts.length,
          posts: posts.map(post => ({
            id: (post._id as any).toString(),
            title: post.title,
            subreddit: post.subreddit,
            generatedMessage: post.generatedMessage,
            redditUrl: `https://reddit.com${post.url}`,
          })),
        },
      });
    }
  } catch (error) {
    next(error);
  }
};
