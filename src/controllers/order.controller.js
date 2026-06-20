import cartModel from "../models/cart.model.js";
import orderModel from "../models/order.model.js";

// create order controller
async function createOrder(req, res) {
  try {
    // find the cart items first and populate
    const cartItems = await cartModel
      .find({
        user: req.user._id,
      })
      .populate("product");

    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    const items = [];
    let totalAmount = 0;
    // iterate cartItems into items array
    for (const item of cartItems) {
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
    });

    await cartModel.deleteMany({
      user: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// get my all orders
async function getMyOrder(req, res) {
  try {
    const orders = await orderModel
      .find({
        user: req.user._id,
      })
      .populate("items.product");

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// get my order by id
async function getMyOrderById(req, res) {
  try {
    const { id } = req.params;

    const order = await orderModel
      .findOne({
        _id: id,
        user: req.user._id,
      })
      .populate("items.product");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// cancel my order
async function cancelMyOrder(req, res) {
  try {
    const { id } = req.params;

    const order = await orderModel.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found ",
      });
    }

    if (order.status !== "pending" && order.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Order can not be cancelled",
      });
    }

    order.status = "cancelled";
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// get seller orders
async function getSellerOrders(req, res) {
  try {
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
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// update order status
async function updateOrderStatus(req, res) {
  try {
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
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await orderModel.findById(id).populate("items.product");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // seller can only update own orders
    const isSellerOrder = order.items.some(
      (item) =>
        item.product &&
        item.product.seller.toString() === req.user._id.toString(),
    );
    if (!isSellerOrder) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this order ",
      });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status update successfully",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export const orderController = {
  createOrder,
  getMyOrder,
  getMyOrderById,
  cancelMyOrder,
  getSellerOrders,
  updateOrderStatus,
};
