import express from "express";

import { addressController } from "../controllers/address.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// add user address
// POST /api/v1/addresses
router.post(
  "/",
  authMiddleware.protect,
  authMiddleware.userOnly,
  addressController.createAddress,
);

// get user address
// GET /api/v1/addresses
router.get(
  "/",
  authMiddleware.protect,
  authMiddleware.userOnly,
  addressController.getMyAddresses,
);

// get user address by id
// GET /api/v1/addresses/:id
router.get(
  "/:id",
  authMiddleware.protect,
  authMiddleware.userOnly,
  addressController.getMyAddressById,
);

// update address
// PUT /api/v1/addresses/:id
router.put(
  "/:id",
  authMiddleware.protect,
  authMiddleware.userOnly,
  addressController.updateMyAddress,
);

// delete address
// DELETE /api/v1/addresses/:delete
router.delete(
  "/:id",
  authMiddleware.protect,
  authMiddleware.userOnly,
  addressController.deleteMyAddress,
);

export default router;
