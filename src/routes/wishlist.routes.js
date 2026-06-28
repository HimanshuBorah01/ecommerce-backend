import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  addWishlist,
  getWishlist,
  removeWishlist,
} from "../controllers/wishlist.controller.js";

const router = express.Router();

// Add product to wishlist
// POST /api/v1/wishlist/:productId
router.post(
  "/:productId",
  authMiddleware.protect,
  authMiddleware.userOnly,
  addWishlist,
);

// get user wishlist
// GET /api/v1/wishlist
router.get("/", authMiddleware.protect, authMiddleware.userOnly, getWishlist);

// remove product from wishlist
// DELETE /api/v1/wishlist/:productId
router.delete(
  "/:productId",
  authMiddleware.protect,
  authMiddleware.userOnly,
  removeWishlist,
);

export default router;
