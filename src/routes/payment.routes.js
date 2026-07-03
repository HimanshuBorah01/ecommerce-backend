import express from "express";

import {
  createRazorpayOrder,
  verifyPayment,
} from "../controllers/payment.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

// TEST ROUTE ONLY
// Used during Razorpay integration testing.
// Actual Razorpay orders are now created from orderController.createOrder().
// Can be removed later if no longer needed.
// create payment route
// POST /api/v1/payment/create-order
router.post(
  "/create-order",
  protect,
  authorize(ROLES.USER),
  createRazorpayOrder,
);

// verify payment
// POST /api/v1/payment/verify-payment
router.post(
  "/verify-payment",
  protect,
  authorize(ROLES.USER),
  verifyPayment,
);

export default router;
