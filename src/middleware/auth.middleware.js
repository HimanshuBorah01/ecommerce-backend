import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";
import config from "../config/config.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { AUTH } from "../constants/auth.js";

// Verify the user is authenticated
export const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[AUTH.JWT_COOKIE_NAME];

  if (!token) {
    throw new ApiError(401, "Authentication required");
  }

  // verify the token and find id
  const decoded = jwt.verify(token, config.JWT_SECRET);
  const user = await userModel.findById(decoded.id).select("-password");

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Account has been deactivated");
  }

  req.user = user;
  next();
});

/**
 * Authorize authenticated users based on their role.
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, "You don't have access");
    }

    next();
  };
};
