import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getSubredditSuggestions,
} from "../controllers/product.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validateProduct } from "../validators/product.validator";

const router = Router();

// Protect all routes
router.use(requireAuth);

router.route("/").get(getProducts).post(validateProduct, createProduct);

router
  .route("/:id")
  .get(getProduct)
  .patch(validateProduct, updateProduct)
  .delete(deleteProduct);

// Get subreddit suggestions for a product
router.get("/:id/suggestions", getSubredditSuggestions);

export default router;
