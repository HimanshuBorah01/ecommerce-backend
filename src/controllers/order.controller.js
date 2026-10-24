import mongoose from "mongoose";
import cartModel from "../models/cart.model.js";
import orderModel from "../models/order.model.js";
import addressModel from "../models/address.model.js";
import productModel from "../models/product.model.js";
import razorpay from "../services/razorpay.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

// Statuses where the stock reserved at order creation is still held for the
// order, i.e. the items are still committed to fulfilling it.
const STOCK_HELD_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
];

// Statuses where the reserved stock has been released back to inventory.
const STOCK_RELEASED_STATUSES = ["cancelled", "returned", "refunded"];

// create order controller
export const createOrder = asyncHandler(async (req, res) => {
  const { addressId, paymentMethod } = req.body;

  // validate the payment method
  if (!["cod", "razorpay"].includes(paymentMethod)) {
    throw new ApiError(400, "Invalid payment method");
  }

  const session = await mongoose.startSession();
  let order;
  let totalAmount = 0;

  try {
    await session.withTransaction(async () => {
      // find the address and validate
      const address = await addressModel
        .findOne({
          _id: addressId,
          user: req.user._id,
        })
        .session(session);

      if (!address) {
        throw new ApiError(404, "Address not found");
      }

      const shippingAddress = {
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        pinCode: address.pinCode,
        country: address.country,
        addressType: address.addressType,
      };

      // find the cart items first and populate
      const cartItems = await cartModel
        .find({
          user: req.user._id,
        })
        .populate("product")
        .session(session);

      if (cartItems.length === 0) {
        throw new ApiError(400, "Cart is empty");
      }

      const items = [];
      totalAmount = 0;

      // build order items and check stock
      for (const item of cartItems) {
        if (!item.product) {
          throw new ApiError(404, "Product not found");
        }

        if (item.product.stock < item.quantity) {
          throw new ApiError(
            400,
            `Insufficient stock for ${item.product.name}`,
          );
        }

        items.push({
          product: item.product._id,
          quantity: item.quantity,
        });
        totalAmount += item.product.price * item.quantity;
      }

      const createdOrders = await orderModel.create(
        [
          {
            user: req.user._id,
            items,
            totalAmount,
            address: addressId,
            shippingAddress,
            paymentMethod,
          },
        ],
        { session },
      );

      order = createdOrders[0];

      // Reserve stock for both COD and Razorpay orders so stock cannot be
      // oversold while a Razorpay payment is pending.
      for (const item of cartItems) {
        const result = await productModel.updateOne(
          {
            _id: item.product._id,
            stock: { $gte: item.quantity },
          },
          {
            $inc: { stock: -item.quantity },
          },
          { session },
        );

        if (result.modifiedCount !== 1) {
          throw new ApiError(
            400,
            `Insufficient stock for ${item.product.name}`,
          );
        }
      }

      if (paymentMethod === "cod") {
        // COD is confirmed now, so clear cart together with stock reservation.
        await cartModel.deleteMany(
          {
            user: req.user._id,
          },
          { session },
        );
      }
    });
  } finally {
    await session.endSession();
  }

  if (paymentMethod === "razorpay") {
    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: order._id.toString(),
    });

    order = await orderModel.findByIdAndUpdate(
      order._id,
      {
        razorpayOrderId: razorpayOrder.id,
      },
      {
        returnDocument: "after",
      },
    );

    return res.status(200).json({
      success: true,
      message: "Order created. Proceed to payment.",
      order,
      razorpayOrder,
    });
  }

  return res.status(201).json({
    success: true,
    message: "Order created successfully",
    order,
  });
});

// get my all orders
export const getMyOrder = asyncHandler(async (req, res) => {
  const orders = await orderModel
    .find({
      user: req.user._id,
    })
    .populate("items.product", "name price images category seller")
    .populate("address");

  return res.status(200).json({
    success: true,
    count: orders.length,
    orders,
  });
});

// get my order by id
export const getMyOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await orderModel
    .findOne({
      _id: id,
      user: req.user._id,
    })
    .populate("items.product", "name price images category seller")
    .populate("address");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  return res.status(200).json({
    success: true,
    order,
  });
});

// cancel my order
export const cancelMyOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify ownership and existence before starting the transaction.
  const order = await orderModel.findOne({
    _id: id,
    user: req.user._id,
  });

  if (!order) {
    throw new ApiError(404, "Order not found ");
  }

  const cancellableStatuses = [
    "pending",
    "confirmed",
    "processing",
    "packed",
  ];

  // Restore product stock atomically with the status change so concurrent
  // cancels cannot double-restore inventory. Only the first concurrent
  // request actually transitions the status; the rest abort.
  const session = await mongoose.startSession();
  let updated;

  try {
    await session.withTransaction(async () => {
      updated = await orderModel.findOneAndUpdate(
        {
          _id: id,
          user: req.user._id,
          status: { $in: cancellableStatuses },
        },
        { $set: { status: "cancelled" } },
        { session, new: true },
      );

      if (!updated) {
        throw new ApiError(400, "Order cannot be cancelled");
      }

      for (const item of updated.items) {
        const result = await productModel.updateOne(
          {
            _id: item.product,
          },
          {
            $inc: { stock: item.quantity },
          },
          { session },
        );

        if (result.matchedCount !== 1) {
          throw new ApiError(404, "Product not found");
        }
      }
    });
  } finally {
    await session.endSession();
  }

  return res.status(200).json({
    success: true,
    message: "Order cancelled successfully",
    order: updated,
  });
});

// return my order (only for delivered orders within 7 days)
export const returnMyOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await orderModel.findOne({
    _id: id,
    user: req.user._id,
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.status !== "delivered") {
    throw new ApiError(
      400,
      "Only delivered orders can be returned",
    );
  }

  if (!order.deliveredAt) {
    if (order.updatedAt) {
      order.deliveredAt = order.updatedAt;
    } else {
      throw new ApiError(
        400,
        "Delivery date is not recorded for this order",
      );
    }
  }

  const daysSinceDelivery = Math.floor(
    (Date.now() - new Date(order.deliveredAt).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  if (daysSinceDelivery > 7) {
    throw new ApiError(
      400,
      `Return window has expired. Orders can only be returned within 7 days of delivery (${daysSinceDelivery} days ago)`,
    );
  }

  if (!reason || reason.trim().length < 3) {
    throw new ApiError(400, "Please provide a valid return reason");
  }

  // Restore product stock atomically with the status change so concurrent
  // returns cannot double-restore inventory.
  const session = await mongoose.startSession();
  let updated;

  try {
    await session.withTransaction(async () => {
      updated = await orderModel.findOneAndUpdate(
        {
          _id: id,
          user: req.user._id,
          status: "delivered",
        },
        {
          $set: {
            status: "returned",
            returnReason: reason.trim(),
          },
        },
        { session, new: true },
      );

      if (!updated) {
        throw new ApiError(400, "Order cannot be returned");
      }

      for (const item of updated.items) {
        const result = await productModel.updateOne(
          {
            _id: item.product,
          },
          {
            $inc: { stock: item.quantity },
          },
          { session },
        );

        if (result.matchedCount !== 1) {
          throw new ApiError(404, "Product not found");
        }
      }
    });
  } finally {
    await session.endSession();
  }

  return res.status(200).json({
    success: true,
    message:
      "Return request submitted successfully. Your items will be picked up soon.",
    order: updated,
  });
});

// get seller orders
export const getSellerOrders = asyncHandler(async (req, res) => {
  // Find all product IDs owned by this seller, then query only orders that
  // contain at least one of those products. This keeps the query at the DB
  // level instead of loading every order in the collection.
  const sellerProductIds = await productModel
    .find({ seller: req.user._id }, { _id: 1 })
    .lean();

  const productIdList = sellerProductIds.map((p) => p._id);

  if (productIdList.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      orders: [],
    });
  }

  const orders = await orderModel
    .find({
      "items.product": { $in: productIdList },
    })
    .populate({
      path: "items.product",
      select: "name price images category seller",
    });

  return res.status(200).json({
    success: true,
    count: orders.length,
    orders,
  });
});

// update order status
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validateStatus = [
    "pending",
    "confirmed",
    "processing",
    "packed",
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "returned",
    "refunded",
  ];

  if (!validateStatus.includes(status)) {
    throw new ApiError(400, "Invalid order status");
  }

  const order = await orderModel.findById(id).populate("items.product");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Enforce a valid lifecycle: statuses must move forward in sequence.
  // Allowed transitions map current status to the next status(es) a seller
  // may set. This prevents jumping straight to "delivered"/"refunded".
  const allowedTransitions = {
    confirmed: ["processing", "cancelled"],
    processing: ["packed", "cancelled"],
    packed: ["shipped", "cancelled"],
    shipped: ["out_for_delivery", "cancelled"],
    out_for_delivery: ["delivered", "cancelled"],
    delivered: ["returned", "refunded"],
    returned: ["refunded"],
    pending: ["confirmed", "cancelled"],
  };

  const allowed = allowedTransitions[order.status];

  if (!allowed || !allowed.includes(status)) {
    throw new ApiError(
      400,
      `Cannot change order status from "${order.status}" to "${status}"`,
    );
  }

  // seller can only update own orders
  const isSellerOrder = order.items.some(
    (item) =>
      item.product &&
      item.product.seller.toString() === req.user._id.toString(),
  );
  if (!isSellerOrder) {
    throw new ApiError(403, "You don't have access to this order ");
  }

  // Stock is reserved when the order is created. Release it back to
  // inventory when the order is cancelled, returned or refunded, so the
  // seller-driven path behaves like the user-driven cancel/return paths.
  // The source status decides whether the stock is still held, which keeps
  // the release idempotent (a "returned" order moving to "refunded" must
  // not restore the stock a second time).
  const shouldReleaseStock =
    STOCK_RELEASED_STATUSES.includes(status) &&
    STOCK_HELD_STATUSES.includes(order.status);

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      if (shouldReleaseStock) {
        for (const item of order.items) {
          const result = await productModel.updateOne(
            {
              _id: item.product._id,
            },
            {
              $inc: { stock: item.quantity },
            },
            { session },
          );

          if (result.matchedCount !== 1) {
            throw new ApiError(404, "Product not found");
          }
        }
      }

      // If a Cash on Delivery (COD) order is delivered,
      // automatically mark the payment as paid.
      if (order.paymentMethod === "cod" && status === "delivered") {
        order.paymentStatus = "paid";
        order.paidAt = new Date();
      }
      if (status === "delivered") {
        order.deliveredAt = new Date();
      }

      order.status = status;
      await order.save({ session });
    });
  } finally {
    await session.endSession();
  }

  return res.status(200).json({
    success: true,
    message: "Order status updated successfully",
    order,
  });
});
