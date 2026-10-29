import crypto from "crypto";
import mongoose from "mongoose";

import razorpay from "../services/razorpay.service.js";
import config from "../config/config.js";
import orderModel from "../models/order.model.js";
import cartModel from "../models/cart.model.js";

import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

// Create or reuse a Razorpay order for an existing app order.
export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    throw new ApiError(400, "Order ID is required");
  }

  const order = await orderModel.findOne({
    _id: orderId,
    user: req.user._id,
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (!order.razorpayOrderId) {
    const razorpayOrder = await razorpay.orders.create({
      amount: order.totalAmount * 100,
      currency: "INR",
      receipt: order._id.toString(),
    });

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    return res.status(200).json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      razorpayOrder,
      order,
    });
  }

  return res.status(200).json({
    success: true,
    razorpayOrderId: order.razorpayOrderId,
    order,
  });
});

// verify payment order
export const verifyPayment = asyncHandler(async (req, res) => {
  const razorpay_order_id =
    req.body.razorpay_order_id || req.body.razorpayOrderId;
  const razorpay_payment_id =
    req.body.razorpay_payment_id || req.body.razorpayPaymentId;
  const razorpay_signature =
    req.body.razorpay_signature || req.body.razorpaySignature;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, "Missing payment verification details");
  }

  // generate payment signature
  const generatedSignature = crypto
    .createHmac("sha256", config.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    throw new ApiError(400, "Invalid payment signature");
  }

  const session = await mongoose.startSession();
  let order;
  let alreadyPaid = false;

  try {
    await session.withTransaction(async () => {
      order = await orderModel
        .findOne({
          razorpayOrderId: razorpay_order_id,
          user: req.user._id,
        })
        .session(session);

      if (!order) {
        throw new ApiError(404, "Order not found");
      }

      if (order.paymentStatus === "paid") {
        alreadyPaid = true;
        return;
      }

      // A cancelled / returned / refunded order must not be re-verified.
      // Stock was already restored on cancel/return and must not be
      // silently re-deducted (oversell / double-count).
      const PAYABLE_STATUSES = ["pending", "confirmed"];
      if (!PAYABLE_STATUSES.includes(order.status)) {
        throw new ApiError(
          400,
          `Cannot verify payment for an order with status "${order.status}"`,
        );
      }

      // Allow retrying a failed payment by resetting it to pending.
      // Other statuses (e.g. refunded) cannot be re-verified.
      if (order.paymentStatus === "failed") {
        order.paymentStatus = "pending";
      }

      if (order.paymentStatus !== "pending") {
        throw new ApiError(400, "Order is not awaiting payment");
      }

      // Stock was already reserved when the order was created, so no
      // deduction is needed here. Just confirm the payment.

      // Idempotency: the same Razorpay payment ID must not be reused to
      // verify a different order (double-spend / cross-order replay).
      const existingPayment = await orderModel
        .findOne({
          razorpayPaymentId: razorpay_payment_id,
        })
        .session(session);

      if (
        existingPayment &&
        existingPayment._id.toString() !== order._id.toString()
      ) {
        throw new ApiError(
          400,
          "This payment has already been used for another order",
        );
      }

      order.paymentStatus = "paid";
      order.status = "confirmed";
      order.razorpayPaymentId = razorpay_payment_id;
      order.razorpaySignature = razorpay_signature;
      order.paidAt = new Date();

      await order.save({ session });

      await cartModel.deleteMany(
        {
          user: order.user,
        },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }

  if (alreadyPaid) {
    return res.status(200).json({
      success: true,
      message: "Payment already verified",
      order,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Payment verified successfully",
    order,
  });
});
