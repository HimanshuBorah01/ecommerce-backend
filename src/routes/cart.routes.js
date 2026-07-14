import express from "express";

import {
  addToCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "../controllers/cart.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import {
  addToCartValidationRules,
  updateCartValidationRules,
} from "../middleware/validation.middleware.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

// add to cart
// POST /api/v1/cart/add
router.post(
  "/add",
  protect,
  authorize(ROLES.USER),
  addToCartValidationRules,
  addToCart,
);

// get cart item
// GET /api/v1/cart
router.get(
  "/",
  protect,
  authorize(ROLES.USER),
  getCart,
);

// remove cart item
// DELETE /api/v1/cart/:id
router.delete(
  "/:id",
  protect,
  authorize(ROLES.USER),
  removeCartItem,
);

// update cart quantity
// PUT /api/v1/cart/:id
router.put(
  "/:id",
  protect,
  authorize(ROLES.USER),
  updateCartValidationRules,
  updateCartItem,
);

export default router;
