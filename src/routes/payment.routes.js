import express from "express";

import { razorpayController } from "../controllers/payment.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// TEST ROUTE ONLY
// Used during Razorpay integration testing.
// Actual Razorpay orders are now created from orderController.createOrder().
// Can be removed later if no longer needed.
// create payment route
router.post(
  "/create-order",
  authMiddleware.protect,
  authMiddleware.userOnly,
  razorpayController.createRazorpayOrder,
);

// verify payment
router.post(
  "/verify-payment",
  authMiddleware.protect,
  authMiddleware.userOnly,
  razorpayController.verifyPayment,
);

export default router;
