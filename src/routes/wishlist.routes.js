import express from "express";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { ROLES } from "../constants/roles.js";
import {
  addWishlist,
  getWishlist,
  removeWishlist,
} from "../controllers/wishlist.controller.js";

const router = express.Router();

// Add product to wishlist
// POST /api/v1/wishlist/:productId
router.post("/:productId", protect, authorize(ROLES.USER), addWishlist);

// get user wishlist
// GET /api/v1/wishlist
router.get("/", protect, authorize(ROLES.USER), getWishlist);

// remove product from wishlist
// DELETE /api/v1/wishlist/:productId
router.delete("/:productId", protect, authorize(ROLES.USER), removeWishlist);

export default router;
