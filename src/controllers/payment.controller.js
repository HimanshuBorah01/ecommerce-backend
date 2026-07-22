import crypto from "crypto";
import mongoose from "mongoose";

import razorpay from "../services/razorpay.service.js";
import config from "../config/config.js";
import orderModel from "../models/order.model.js";
import cartModel from "../models/cart.model.js";
import productModel from "../models/product.model.js";

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

      if (order.paymentStatus !== "pending") {
        throw new ApiError(400, "Order is not awaiting payment");
      }

      // Payment is valid now, so reduce stock for the ordered products.
      for (const item of order.items) {
        const product = await productModel
          .findById(item.product)
          .session(session);

        if (!product) {
          throw new ApiError(404, "Product not found");
        }

        const result = await productModel.updateOne(
          {
            _id: item.product,
            stock: { $gte: item.quantity },
          },
          {
            $inc: { stock: -item.quantity },
          },
          { session },
        );

        if (result.modifiedCount !== 1) {
          throw new ApiError(400, `Insufficient stock for ${product.name}`);
        }
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
