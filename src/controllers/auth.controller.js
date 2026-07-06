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

  res.cookie(AUTH.JWT_COOKIE_NAME, accessToken, cookieOptions);
  res.cookie(AUTH.REFRESH_TOKEN_COOKIE_NAME, refreshToken, cookieOptions);

  return res.status(200).json({
    success: true,
    message: "Login successful",
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
  res.clearCookie(AUTH.JWT_COOKIE_NAME, cookieOptions);
  res.clearCookie(AUTH.REFRESH_TOKEN_COOKIE_NAME, cookieOptions);

  return res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
});

// Refresh access token
export const refreshToken = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken } = await authService.refreshToken(
    req.cookies,
  );

  res.cookie(AUTH.JWT_COOKIE_NAME, accessToken, cookieOptions);
  res.cookie(AUTH.REFRESH_TOKEN_COOKIE_NAME, refreshToken, cookieOptions);

  return res.status(200).json({
    success: true,
    message: "Access token refreshed successfully",
  });
});
