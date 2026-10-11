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
  normalizeAddressPayload,
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
  normalizeAddressPayload,
  createAddressValidationRules,
  createAddress,
);

// get user address
// GET /api/v1/addresses
router.get("/", protect, authorize(ROLES.USER), getMyAddresses);

// get user address by id
// GET /api/v1/addresses/:id
router.get("/:id", protect, authorize(ROLES.USER), getMyAddressById);

// update address
// PUT /api/v1/addresses/:id
router.put(
    "/:id",
    protect,
    authorize(ROLES.USER),
    normalizeAddressPayload,
    updateAddressValidationRules,
    updateMyAddress,
  );

  // Partial update of an address (e.g. toggle isDefault without sending the
  // full payload). updateMyAddress only touches fields that are present, so
  // it is safe to reuse for PATCH.
  router.patch(
    "/:id",
    protect,
    authorize(ROLES.USER),
    normalizeAddressPayload,
    updateAddressValidationRules,
    updateMyAddress,
  );

  // delete address
  // DELETE /api/v1/addresses/:id
  router.delete("/:id", protect, authorize(ROLES.USER), deleteMyAddress);

export default router;
