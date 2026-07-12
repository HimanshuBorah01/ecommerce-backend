import asyncHandler from "../utils/asyncHandler.js";
import cookieOptions from "../utils/cookieOptions.js";
import authService from "../services/auth.service.js";
import { AUTH } from "../constants/auth.js";

/**
 * Register a new user
@param {import("express").Request}req
@param {import("express").Response} res 
*/
// Register a new user
export const registerUser = asyncHandler(async (req, res) => {
  const { user } = await authService.register(req.body);

  return res.status(201).json({
    success: true,
    message: "User registered successfully",
    user: {
      id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
    },
  });
});

// Login user
export const loginUser = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);

  res.cookie(AUTH.REFRESH_TOKEN_COOKIE_NAME, refreshToken, cookieOptions);

  return res.status(200).json({
    success: true,
    message: "Login successful",
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
    },
  });
});

// Logout user
export const logoutUser = asyncHandler(async (req, res) => {
  // Revoke current session
  await authService.logout(req.cookies);

  // Clear cookies
  res.clearCookie(AUTH.REFRESH_TOKEN_COOKIE_NAME, cookieOptions);

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

/**
 * Logout user from all devices.
 */
export const logoutAllDevices = asyncHandler(async (req, res) => {
  await authService.logoutAllDevices(req.user._id);

  res.clearCookie(AUTH.REFRESH_TOKEN_COOKIE_NAME, cookieOptions);

  return res.status(200).json({
    success: true,
    message: "Logged out from all devices successfully",
  });
});

// Refresh access token
export const refreshToken = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken: newRefreshToken } =
    await authService.refreshToken(req.cookies);

  res.cookie(AUTH.REFRESH_TOKEN_COOKIE_NAME, newRefreshToken, cookieOptions);

  return res.status(200).json({
    success: true,
    message: "Access token refreshed successfully",
    accessToken,
  });
});

/**
 * Get current authenticated user.
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      isEmailVerified: req.user.isEmailVerified,
    },
  });
});

/**
 * Forgot password.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.forgotPassword(email);

  return res.status(200).json({
    success: true,
    message:
      "If an account with that email exists, a password reset link has been sent.",
  });
});

/**
 * Reset password.
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  await authService.resetPassword(token, newPassword);

  return res.status(200).json({
    success: true,
    message: "Password reset successfully. Please log in again.",
  });
});

/**
 * Change password.
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  await authService.changePassword(req.user._id, currentPassword, newPassword);

  return res.status(200).json({
    success: true,
    message:
      "Password changed successfully. Please log in again on all devices.",
  });
});

/**
 * Verify email.
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  await authService.verifyEmail(token);

  return res.status(200).json({
    success: true,
    message: "Email verified successfully.",
  });
});

/**
 * Resend verification email.
 */
export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.resendVerificationEmail(email);

  return res.status(200).json({
    success: true,
    message:
      "If the email exists and is not verified, a new verification email has been sent.",
  });
});
