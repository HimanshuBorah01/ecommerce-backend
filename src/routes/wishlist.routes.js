import express from "express";
import { addWishlist } from "../controllers/wishlist.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// Add product to wishlist
// POST /api/v1/wishlist/:productId
router.post(
  "/:productId",
  authMiddleware.protect,
  authMiddleware.userOnly,
  addWishlist,
);

export default router;
