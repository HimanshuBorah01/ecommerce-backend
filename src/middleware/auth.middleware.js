import jwt from "jsonwebtoken";

import userModel from "../models/user.model.js";
import config from "../config/config.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

// Verify the user is authenticated
export const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    throw new ApiError(401, "Authentication required");
  }

  // verify the token and find id
  const decoded = jwt.verify(token, config.JWT_SECRET);
  const user = await userModel.findById(decoded.id);

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  req.user = user;
  next();
});

// Verify the user has one of the required roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, "You don't have access");
    }

    next();
  };
};
