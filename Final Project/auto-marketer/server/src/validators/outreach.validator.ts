import { body } from "express-validator";
import Product from "../models/Product";
import { handleValidationErrors } from "./validation.handler";

export const validateOutreach = [
  // Product validation
  body("product")
    .notEmpty()
    .withMessage("Product is required")
    .isMongoId()
    .withMessage("Invalid product ID")
    .custom(async (value, { req }) => {
      const product = await Product.findOne({
        _id: value,
        user: req.user._id,
      });
      if (!product) {
        throw new Error("Product not found or not owned by user");
      }
      return true;
    }),

  // Subreddits validation
  body("subreddits")
    .isArray()
    .withMessage("Subreddits must be an array")
    .notEmpty()
    .withMessage("At least one subreddit is required")
    .custom((subreddits: string[]) => {
      if (subreddits.length === 0) {
        throw new Error("At least one subreddit is required");
      }
      return subreddits.every(
        (subreddit) =>
          typeof subreddit === "string" &&
          subreddit.length >= 3 &&
          subreddit.length <= 21 &&
          /^[a-zA-Z0-9_]+$/.test(subreddit)
      );
    })
    .withMessage(
      "Each subreddit must be 3-21 characters and contain only letters, numbers, and underscores"
    ),

  // Start date validation
  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid start date format")
    .custom((value, { req }) => {
      if (
        value &&
        req.body.endDate &&
        new Date(value) >= new Date(req.body.endDate)
      ) {
        throw new Error("Start date must be before end date");
      }
      return true;
    }),

  // End date validation
  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid end date format")
    .custom((value, { req }) => {
      if (
        value &&
        req.body.startDate &&
        new Date(value) <= new Date(req.body.startDate)
      ) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

  // Max posts validation
  body("maxPosts")
    .optional()
    .isInt({ min: 1, max: 5000 })
    .withMessage("Max posts must be between 1 and 5000"),

  handleValidationErrors,
];
