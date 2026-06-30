import express from "express";

import {
  addToCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "../controllers/cart.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// add to cart
// POST /api/v1/cart/add
router.post(
  "/add",
  authMiddleware.protect,
  authMiddleware.userOnly,
  addToCart,
);

// get cart item
// GET /api/v1/cart
router.get(
  "/",
  authMiddleware.protect,
  authMiddleware.userOnly,
  getCart,
);

// remove cart item
// DELETE /api/v1/cart/delete
router.delete(
  "/:id",
  authMiddleware.protect,
  authMiddleware.userOnly,
  removeCartItem,
);

// update cart quantity
// PUT /api/v1/cart/:id
router.put(
  "/:id",
  authMiddleware.protect,
  authMiddleware.userOnly,
  updateCartItem,
);

export default router;
