import express from "express";

import {
  createOrder,
  getMyOrder,
  getSellerOrders,
  getMyOrderById,
  cancelMyOrder,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

// create order route
// POST /api/v1/orders
router.post("/", protect, authorize(ROLES.USER), createOrder);

// get my all orders
// GET /api/v1/orders/my-orders
router.get("/", protect, authorize(ROLES.USER), getMyOrder);

router.get("/my-orders", protect, authorize(ROLES.USER), getMyOrder);

// get all the seller orders
// GET /api/v1/orders/seller-order
router.get("/seller-orders", protect, authorize(ROLES.SELLER), getSellerOrders);

// get my order my id
// GET /api/v1/orders/:id
router.get("/:id", protect, authorize(ROLES.USER), getMyOrderById);

//cancel my order
// PUT /api/v1/orders/:id/cancel
router.put("/:id/cancel", protect, authorize(ROLES.USER), cancelMyOrder);

// update order status by seller
// PUT /api/v1/orders/:id/status
router.put("/:id/status", protect, authorize(ROLES.SELLER), updateOrderStatus);

export default router;
