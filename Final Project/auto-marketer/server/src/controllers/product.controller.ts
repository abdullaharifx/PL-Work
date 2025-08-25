import { Request, Response, NextFunction } from "express";
import Product, { IProduct } from "../models/Product";
import { AppError } from "../middleware/error.middleware";
import aiResponseGenerator from "../utils/aiResponse";

// Create a new product
export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await Product.create({
      ...req.body,
      user: req.user._id,
    });
    res.status(201).json({
      status: "success",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Get all products with optional filtering
export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Create a query object with only the user ID and search query if provided
    const queryObj: Record<string, any> = { user: req.user._id };

    // Add search query if it exists
    if (req.query.search) {
      queryObj.name = { $regex: req.query.search, $options: "i" };
    }

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const products = await Product.find(queryObj).skip(skip).limit(limit);
    const total = await Product.countDocuments(queryObj);

    res.status(200).json({
      status: "success",
      results: products.length,
      total,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single product
export const getProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!product) {
      return next(new AppError("No product found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Update a product
export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await Product.findOneAndUpdate(
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

    if (!product) {
      return next(new AppError("No product found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a product
export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!product) {
      return next(new AppError("No product found with that ID", 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// Get subreddit suggestions for a product
export const getSubredditSuggestions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!product) {
      return next(new AppError("No product found with that ID", 404));
    }

    const subreddits = await aiResponseGenerator.suggestSubreddits(product);

    res.status(200).json({
      status: "success",
      data: subreddits,
    });
  } catch (error) {
    next(error);
  }
};
