import { NextFunction, Request, Response } from "express";
import { AppError } from "../middleware/error.middleware";
import Post from "../models/Post";
import Outreach from "../models/Outreach";

// Get all posts for a specific outreach
export const getAllOutreachPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const outreachId = req.params.id;

    // Check if the outreach exists and belongs to the user
    const outreach = await Outreach.findOne({
      _id: outreachId,
      user: req.user._id,
    });

    if (!outreach) {
      return next(new AppError("No outreach campaign found with that ID", 404));
    }

    // Get all posts for this outreach
    const posts = await Post.find({ outreach: outreachId })
      .sort({ date: -1 })
      .lean();

    res.status(200).json({
      status: "success",
      results: posts.length,
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

// Get relevant posts (where canSolve is true) for a specific outreach
export const getRelevantOutreachPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const outreachId = req.params.id;

    // Check if the outreach exists and belongs to the user
    const outreach = await Outreach.findOne({
      _id: outreachId,
      user: req.user._id,
    });

    if (!outreach) {
      return next(new AppError("No outreach campaign found with that ID", 404));
    }

    // Get relevant posts (where canSolve is true) for this outreach
    const posts = await Post.find({
      outreach: outreachId,
      canSolve: true,
    })
      .sort({ date: -1 })
      .lean();

    res.status(200).json({
      status: "success",
      results: posts.length,
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};
