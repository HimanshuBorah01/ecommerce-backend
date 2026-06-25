import express from "express";

import { orderController } from "../controllers/order.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// create order route
router.post(
  "/",
  authMiddleware.protect,
  authMiddleware.userOnly,
  orderController.createOrder,
);

// get my all orders
router.get(
  "/my-orders",
  authMiddleware.protect,
  authMiddleware.userOnly,
  orderController.getMyOrder,
);

// get all the seller orders
router.get(
  "/seller-orders",
  authMiddleware.protect,
  authMiddleware.sellerOnly,
  orderController.getSellerOrders,
);

// get my order my id
router.get(
  "/:id",
  authMiddleware.protect,
  authMiddleware.userOnly,
  orderController.getMyOrderById,
);

//cancel my order
router.put(
  "/:id/cancel",
  authMiddleware.protect,
  authMiddleware.userOnly,
  orderController.cancelMyOrder,
);

// update order status by seller
// PUT /api/v1/orders/:id/status
router.put(
  "/:id/status",
  authMiddleware.protect,
  authMiddleware.sellerOnly,
  orderController.updateOrderStatus,
);

export default router;
