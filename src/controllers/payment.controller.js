import crypto from "crypto";

import razorpay from "../services/razorpay.service.js";
import config from "../config/config.js";
import orderModel from "../models/order.model.js";
import cartModel from "../models/cart.model.js";

import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

// LEGACY TEST ENDPOINT
// Purpose:
// 1. Verify Razorpay SDK configuration.
// 2. Verify API keys.
// 3. Test Razorpay order creation independently.
//
// Not used by the actual ecommerce checkout flow.
// Actual flow:
// POST /orders
// -> orderController.createOrder()
// -> razorpay.orders.create()
// -> verifyPayment()
// create payment order
export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  const options = {
    amount: amount * 100,
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  };

  const order = await razorpay.orders.create(options);

  return res.status(200).json({
    success: true,
    order,
  });
});

// verify payment order
export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  // generate payment signature
  const generatedSignature = crypto
    .createHmac("sha256", config.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    throw new ApiError(400, "Invalid payment signature");
  }

  const order = await orderModel.findOne({
    razorpayOrderId: razorpay_order_id,
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  order.paymentStatus = "paid";
  order.status = "confirmed";
  order.razorpayPaymentId = razorpay_payment_id;
  order.razorpaySignature = razorpay_signature;
  order.paidAt = new Date();

  await order.save();

  await cartModel.deleteMany({
    user: order.user,
  });

  return res.status(200).json({
    success: true,
    message: "Payment verified",
    order,
  });
});
