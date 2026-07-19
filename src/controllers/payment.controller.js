import crypto from "crypto";

import razorpay from "../services/razorpay.service.js";
import config from "../config/config.js";
import orderModel from "../models/order.model.js";
import cartModel from "../models/cart.model.js";
import productModel from "../models/product.model.js";

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
  const { amount, orderId } = req.body;

  if (orderId) {
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
  }

  if (!amount || Number(amount) <= 0) {
    throw new ApiError(400, "Valid payment amount is required");
  }

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

  const order = await orderModel.findOne({
    razorpayOrderId: razorpay_order_id,
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.paymentStatus === "paid") {
    return res.status(200).json({
      success: true,
      message: "Payment already verified",
      order,
    });
  }

  if (order.paymentStatus !== "pending") {
    throw new ApiError(400, "Order is not awaiting payment");
  }

  // Payment is valid now, so reduce stock for the ordered products.
  for (const item of order.items) {
    const product = await productModel.findById(item.product);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    if (product.stock < item.quantity) {
      throw new ApiError(400, `Insufficient stock for ${product.name}`);
    }

    product.stock -= item.quantity;
    await product.save();
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
    message: "Payment verified successfully",
    order,
  });
});
