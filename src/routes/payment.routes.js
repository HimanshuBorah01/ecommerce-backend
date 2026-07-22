import express from "express";

import {
  createRazorpayOrder,
  verifyPayment,
} from "../controllers/payment.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

// Create or reuse a Razorpay order for an existing app order.
router.post("/order", protect, authorize(ROLES.USER), createRazorpayOrder);

// verify payment
// POST /api/v1/payment/verify-payment
router.post("/verify-payment", protect, authorize(ROLES.USER), verifyPayment);
router.post("/verify", protect, authorize(ROLES.USER), verifyPayment);

export default router;
