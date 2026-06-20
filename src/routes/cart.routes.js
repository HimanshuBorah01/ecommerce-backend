import express from "express";

import { cartController } from "../controllers/cart.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// add to cart
router.post(
  "/add",
  authMiddleware.protect,
  authMiddleware.userOnly,
  cartController.addToCart,
);

// get cart item
router.get(
  "/",
  authMiddleware.protect,
  authMiddleware.userOnly,
  cartController.getCart,
);

// remove cart item
router.delete(
  "/:id",
  authMiddleware.protect,
  authMiddleware.userOnly,
  cartController.removeCartItem,
);

// update cart quantity
router.put(
  "/:id",
  authMiddleware.protect,
  authMiddleware.userOnly,
  cartController.updateCartItem,
);

export default router;
