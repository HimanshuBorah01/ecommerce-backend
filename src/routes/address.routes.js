import express from "express";

import { addressController } from "../controllers/address.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// add user address
router.post(
  "/",
  authMiddleware.protect,
  authMiddleware.userOnly,
  addressController.createAddress,
);

// get user address
router.get(
  "/",
  authMiddleware.protect,
  authMiddleware.userOnly,
  addressController.getMyAddresses,
);

// get user address by id
router.get(
  "/:id",
  authMiddleware.protect,
  authMiddleware.userOnly,
  addressController.getMyAddressById,
);

// update address
router.put(
  "/:id",
  authMiddleware.protect,
  authMiddleware.userOnly,
  addressController.updateMyAddress,
);

// delete address
router.delete(
  "/:id",
  authMiddleware.protect,
  authMiddleware.userOnly,
  addressController.deleteMyAddress,
);

export default router;
