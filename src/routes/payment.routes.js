import express from "express";

import { razorpayController } from "../controllers/payment.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

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
