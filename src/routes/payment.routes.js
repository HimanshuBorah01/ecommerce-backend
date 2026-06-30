import express from "express";

import {
  createRazorpayOrder,
  verifyPayment,
} from "../controllers/payment.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// TEST ROUTE ONLY
// Used during Razorpay integration testing.
// Actual Razorpay orders are now created from orderController.createOrder().
// Can be removed later if no longer needed.
// create payment route
// POST /api/v1/payment/create-order
router.post(
  "/create-order",
  authMiddleware.protect,
  authMiddleware.userOnly,
  createRazorpayOrder,
);

// verify payment
// POST /api/v1/payment/verify-payment
router.post(
  "/verify-payment",
  authMiddleware.protect,
  authMiddleware.userOnly,
  verifyPayment,
);

export default router;
