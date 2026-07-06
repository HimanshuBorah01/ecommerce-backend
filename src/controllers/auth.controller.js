import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import cookieOptions from "../utils/cookieOptions.js";
import authService from "../services/auth.service.js";

/**
 * Register a new user
@param {import("express").Request}req
@param {import("express").Response} res 
*/
// Register a new user
export const registerUser = asyncHandler(async (req, res) => {
  const { user, accessToken } = await authService.register(req.body);
  res.cookie("token", accessToken, cookieOptions);

  res.status(201).json({
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
  const { user, accessToken } = await authService.login(req.body);
  res.cookie("token", accessToken, cookieOptions);

  res.status(200).json({
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
  res.clearCookie("token", cookieOptions);

  return res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
});
