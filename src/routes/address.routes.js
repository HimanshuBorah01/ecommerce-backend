import express from "express";

import {
  createAddress,
  getMyAddresses,
  getMyAddressById,
  updateMyAddress,
  deleteMyAddress,
} from "../controllers/address.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import {
  createAddressValidationRules,
  updateAddressValidationRules,
} from "../middleware/validation.middleware.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

// add user address
// POST /api/v1/addresses
router.post(
  "/",
  protect,
  authorize(ROLES.USER),
  createAddressValidationRules,
  createAddress,
);

// get user address
// GET /api/v1/addresses
router.get(
  "/",
  protect,
  authorize(ROLES.USER),
  getMyAddresses,
);

// get user address by id
// GET /api/v1/addresses/:id
router.get(
  "/:id",
  protect,
  authorize(ROLES.USER),
  getMyAddressById,
);

// update address
// PUT /api/v1/addresses/:id
router.put(
  "/:id",
  protect,
  authorize(ROLES.USER),
  updateAddressValidationRules,
  updateMyAddress,
);

// delete address
// DELETE /api/v1/addresses/:id
router.delete(
  "/:id",
  protect,
  authorize(ROLES.USER),
  deleteMyAddress,
);

export default router;
