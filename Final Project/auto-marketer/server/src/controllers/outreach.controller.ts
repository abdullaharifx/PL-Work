import { NextFunction, Request, Response } from "express";
import { AppError } from "../middleware/error.middleware";
import Outreach from "../models/Outreach";
import Post from "../models/Post";
import { IProduct } from "../models/Product";
import { postAnalyzer } from "../utils/postAnalyzer";
import { redditScraper } from "../utils/redditScraper";

// Get all outreach campaigns for a user
export const getOutreaches = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const searchQuery = req.query.search as string;
    const query: any = { user: req.user._id };

    if (searchQuery) {
      query.$or = [
        { "product.name": { $regex: searchQuery, $options: "i" } },
        { "product.domain": { $regex: searchQuery, $options: "i" } },
        { subreddits: { $in: [new RegExp(searchQuery, "i")] } },
      ];
    }

    const outreaches = await Outreach.find(query)
      .populate("product", "name domain")
      .sort("-createdAt");

    res.status(200).json({
      status: "success",
      results: outreaches.length,
      data: outreaches,
    });
  } catch (error) {
    next(error);
  }
};

// Get single outreach campaign
export const getOutreach = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const outreach = await Outreach.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate("product", "name domain");

    if (!outreach) {
      return next(new AppError("No outreach campaign found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: outreach,
    });
  } catch (error) {
    next(error);
  }
};

// Create outreach campaign
export const createOutreach = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const outreach = await Outreach.create({
      ...req.body,
      user: req.user._id,
    });

    res.status(201).json({
      status: "success",
      data: outreach,
    });
  } catch (error) {
    next(error);
  }
};

// Update outreach campaign
export const updateOutreach = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const outreach = await Outreach.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!outreach) {
      return next(new AppError("No outreach campaign found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: outreach,
    });
  } catch (error) {
    next(error);
  }
};

// Delete outreach campaign
export const deleteOutreach = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const outreach = await Outreach.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!outreach) {
      return next(new AppError("No outreach campaign found with that ID", 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// Run outreach campaign
export const runOutreach = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const outreachId = req.params.id;

    // Get outreach and verify ownership
    const outreach = await Outreach.findOne({
      _id: outreachId,
      user: req.user._id,
    }).populate("product");

    if (!outreach) {
      return next(new AppError("No outreach campaign found with that ID", 404));
    }

    // Get existing post IDs to avoid duplicates
    const existingPosts = await Post.find({ outreach: outreachId }).select(
      "post_id"
    );
    const existingPostIds = new Set(existingPosts.map((post) => post.post_id));

    // Get posts from Reddit
    const posts = await redditScraper.scrapePosts({
      subreddits: outreach.subreddits,
      maxPosts: outreach.maxPosts || 100,
      startDate: outreach.startDate || new Date(),
      endDate:
        outreach.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days if not specified
      outreach: outreachId,
      accessToken: req.user.redditAccessToken,
    });

    // Filter out posts that already exist
    const newPosts = posts.filter(
      (post) =>
        post.text &&
        post.text.trim() !== "" &&
        !existingPostIds.has(post.post_id as string)
    );

    if (newPosts.length === 0) {
      return res.status(200).json({
        status: "success",
        data: {
          outreach: outreach._id,
          message: "No new posts found",
          totalPosts: existingPosts.length,
          newPosts: 0,
        },
      });
    }

    // Analyze new posts with AI
    const analyzedPosts = await postAnalyzer.analyzePosts(
      newPosts,
      outreach.product as IProduct
    );

    // Store new posts in database
    const savedPosts = await Post.insertMany(analyzedPosts);

    res.status(200).json({
      status: "success",
      data: {
        outreach: outreach._id,
        totalPosts: existingPosts.length + savedPosts.length,
        newPosts: savedPosts.length,
        relevantPosts: savedPosts.filter((post) => post.canSolve).length,
      },
    });
  } catch (error) {
    next(error);
  }
};
