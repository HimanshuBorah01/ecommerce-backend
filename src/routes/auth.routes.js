import express from "express";
import { validationMiddleware } from "../middleware/validation.middleware.js";
import { protect } from "../middleware/auth.middleware.js";

import {
  registerUser,
  loginUser,
  logoutUser,
  logoutAllDevices,
  refreshToken,
  getCurrentUser,
  forgotPassword,
} from "../controllers/auth.controller.js";
const router = express.Router();

// User Routes for registration, login, logout
// register new user or create account
// POST /api/v1/auth/register
router.post(
  "/register",
  validationMiddleware.registerValidationRules,
  registerUser,
);

// login user
// POST /api/v1/auth/login
router.post("/login", validationMiddleware.loginValidationRules, loginUser);

// Refresh access token
// POST /api/v1/auth/refresh-token
router.post("/refresh-token", refreshToken);

// logout user
// POST /api/v1/auth/logout
router.post("/logout", protect, logoutUser);

router.post("/logout-all", protect, logoutAllDevices);

router.post(
  "/forgot-password",
  validationMiddleware.forgotPasswordValidationRules,
  forgotPassword,
);

// Get current authenticated user
// GET /api/v1/auth/me
router.get("/me", protect, getCurrentUser);

export default router;
