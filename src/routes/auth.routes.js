import express from "express";
import {
  registerValidationRules,
  loginValidationRules,
  forgotPasswordValidationRules,
  resetPasswordValidationRules,
  changePasswordValidationRules,
  verifyEmailValidationRules,
} from "../middleware/validation.middleware.js";
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
router.post("/register", registerValidationRules, registerUser);

// login user
// POST /api/v1/auth/login
router.post("/login", authRateLimiter, loginValidationRules, loginUser);

// Refresh access token
// POST /api/v1/auth/refresh-token
router.post("/refresh-token", refreshToken);
router.post("/refresh", refreshToken);

// logout user
// POST /api/v1/auth/logout
router.post("/logout", protect, logoutUser);

// Logout from all devices
// POST /api/v1/auth/logout-all
router.post("/logout-all", protect, logoutAllDevices);

// Forgot password
// POST /api/v1/auth/forgot-password
router.post(
  "/forgot-password",
  authRateLimiter,
  forgotPasswordValidationRules,
  forgotPassword,
);

// Reset password
// POST /api/v1/auth/reset-password
router.post(
  "/reset-password",
  authRateLimiter,
  resetPasswordValidationRules,
  resetPassword,
);

// Change password
// POST /api/v1/auth/change-password
router.post(
  "/change-password",
  protect,
  changePasswordValidationRules,
  changePassword,
);

// Verify email
// POST /api/v1/auth/verify-email
router.post("/verify-email", verifyEmailValidationRules, verifyEmail);

// Resend verification email
// POST /api/v1/auth/resend-verification-email
router.post(
  "/resend-verification-email",
  authRateLimiter,
  forgotPasswordValidationRules,
  resendVerificationEmail,
);

// Get current authenticated user
// GET /api/v1/auth/me
router.get("/me", protect, getCurrentUser);

export default router;
