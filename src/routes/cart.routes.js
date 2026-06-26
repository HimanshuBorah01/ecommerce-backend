import express from "express";

import { cartController } from "../controllers/cart.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// add to cart
// POST /api/v1/cart/add
router.post(
  "/add",
  authMiddleware.protect,
  authMiddleware.userOnly,
  cartController.addToCart,
);

// get cart item
// GET /api/v1/cart
router.get(
  "/",
  authMiddleware.protect,
  authMiddleware.userOnly,
  cartController.getCart,
);

// remove cart item
// DELETE /api/v1/cart/delete
router.delete(
  "/:id",
  authMiddleware.protect,
  authMiddleware.userOnly,
  cartController.removeCartItem,
);

// update cart quantity
// PUT /api/v1/cart/:id
router.put(
  "/:id",
  authMiddleware.protect,
  authMiddleware.userOnly,
  cartController.updateCartItem,
);

export default router;
