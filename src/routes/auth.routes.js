import express from "express";
import { validationMiddleware } from "../middleware/validation.middleware.js";
import { protect } from "../middleware/auth.middleware.js";
import { authRateLimiter } from "../middleware/rateLimiter.middleware.js";

import {
  registerUser,
  loginUser,
  logoutUser,
  logoutAllDevices,
  refreshToken,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  resendVerificationEmail,
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
router.post(
  "/login",
  authRateLimiter,
  validationMiddleware.loginValidationRules,
  loginUser,
);

// Refresh access token
// POST /api/v1/auth/refresh-token
router.post("/refresh-token", refreshToken);

// logout user
// POST /api/v1/auth/logout
router.post("/logout", protect, logoutUser);

router.post("/logout-all", protect, logoutAllDevices);

router.post(
  "/forgot-password",
  authRateLimiter,
  validationMiddleware.forgotPasswordValidationRules,
  forgotPassword,
);

// Reset password
// POST /api/v1/auth/reset-password
router.post(
  "/reset-password",
  authRateLimiter,
  validationMiddleware.resetPasswordValidationRules,
  resetPassword,
);

// Change password
// POST /api/v1/auth/change-password
router.post(
  "/change-password",
  protect,
  validationMiddleware.changePasswordValidationRules,
  changePassword,
);

// Verify email
// POST /api/v1/auth/verify-email
router.post("/verify-email", verifyEmail);


router.post(
  "/resend-verification-email",
  authRateLimiter,
  validationMiddleware.forgotPasswordValidationRules,
  resendVerificationEmail,
);

// Get current authenticated user
// GET /api/v1/auth/me
router.get("/me", protect, getCurrentUser);

export default router;
