import cartModel from "../models/cart.model.js";
import orderModel from "../models/order.model.js";
import addressModel from "../models/address.model.js";
import razorpay from "../services/razorpay.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

// create order controller
export const createOrder = asyncHandler(async (req, res) => {
  const { addressId, paymentMethod } = req.body;
  // validate the payment method
  if (!["cod", "razorpay"].includes(paymentMethod)) {
    throw new ApiError(400, "Invalid payment method");
  }

  // find the address and validate
  const address = await addressModel.findOne({
    _id: addressId,
    user: req.user._id,
  });

  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  // find the cart items first and populate
  const cartItems = await cartModel
    .find({
      user: req.user._id,
    })
    .populate("product");

  if (cartItems.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  const items = [];
  let totalAmount = 0;
  // iterate cartItems into items array
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
    totalAmount += item.product.price * item.quantity; // calculate total amount
  }

  // created the order
  const order = await orderModel.create({
    user: req.user._id,
    items,
    totalAmount,
    address: addressId,
    paymentMethod,
  });

  if (paymentMethod === "razorpay") {
    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: order._id.toString(),
    });

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order created. Proceed to payment.",
      order,
      razorpayOrder,
    });
  }

  // For COD, stock is reduced immediately because the order is confirmed now.
  // For Razorpay, stock is reduced only after successful payment verification.
  for (const item of cartItems) {
    item.product.stock -= item.quantity;
    await item.product.save();
  }

  await cartModel.deleteMany({
    user: req.user._id,
  });

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
    .populate("items.product", "name price images category seller");

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
    .populate("items.product", "name price images category seller");

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

  const order = await orderModel.findOne({
    _id: id,
    user: req.user._id,
  });

  if (!order) {
    throw new ApiError(404, "Order not found ");
  }

  if (order.status !== "pending" && order.status !== "confirmed") {
    throw new ApiError(400, "Order can not be cancelled");
  }

  order.status = "cancelled";
  await order.save();

  return res.status(200).json({
    success: true,
    message: "Order cancelled successfully",
    order,
  });
});

// get seller orders
export const getSellerOrders = asyncHandler(async (req, res) => {
  const orders = await orderModel.find().populate({
    path: "items.product",
    match: {
      seller: req.user._id,
    },
  });

  // finding the ordered product
  const sellerOrders = orders.filter((order) => {
    return order.items.some((item) => item.product);
  });

  return res.status(200).json({
    success: true,
    count: sellerOrders.length,
    orders: sellerOrders,
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

  // seller can only update own orders
  const isSellerOrder = order.items.some(
    (item) =>
      item.product &&
      item.product.seller.toString() === req.user._id.toString(),
  );
  if (!isSellerOrder) {
    throw new ApiError(403, "You don't have access to this order ");
  }

  // If a Cash on Delivery (COD) order is delivered,
  // automatically mark the payment as paid.
  order.status = status;
  if (order.paymentMethod === "cod" && status === "delivered") {
    order.paymentStatus = "paid";
    order.paidAt = new Date();
  }

  await order.save();

  return res.status(200).json({
    success: true,
    message: "Order status updated successfully",
    order,
  });
});
