import express from "express";

import {
  createOrder,
  getMyOrder,
  getSellerOrders,
  getMyOrderById,
  cancelMyOrder,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// create order route
// POST /api/v1/orders
router.post(
  "/",
  authMiddleware.protect,
  authMiddleware.userOnly,
  createOrder,
);

// get my all orders
// GET /api/v1/orders/my-orders
router.get(
  "/my-orders",
  authMiddleware.protect,
  authMiddleware.userOnly,
  getMyOrder,
);

// get all the seller orders
// GET /api/v1/orders/seller-order
router.get(
  "/seller-orders",
  authMiddleware.protect,
  authMiddleware.sellerOnly,
  getSellerOrders,
);

// get my order my id
// GET /api/v1/orders/:id
router.get(
  "/:id",
  authMiddleware.protect,
  authMiddleware.userOnly,
  getMyOrderById,
);

//cancel my order
// PUT /api/v1/orders/:id/cancel 
router.put(
  "/:id/cancel",
  authMiddleware.protect,
  authMiddleware.userOnly,
  cancelMyOrder,
);

// update order status by seller
// PUT /api/v1/orders/:id/status
router.put(
  "/:id/status",
  authMiddleware.protect,
  authMiddleware.sellerOnly,
  updateOrderStatus,
);

export default router;
