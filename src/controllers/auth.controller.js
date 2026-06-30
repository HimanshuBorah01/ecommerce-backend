import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import userModel from "../models/user.model.js";
import config from "../config/config.js";

import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

/**
 * Register a new user
@param {import("express").Request}req
@param {import("express").Response} res 
*/
// Register a new user
export const registerUser = asyncHandler(async (req, res) => {
  const { name, phone, email, password, role = "user" } = req.body;

  const isUserAlreadyExist = await userModel.findOne({
    $or: [{ phone }, { email }],
  });

  if (isUserAlreadyExist) {
    throw new ApiError(
      409,
      "User with this phone number or email already exist",
    );
  }

  // password is hashing
  const hash = await bcrypt.hash(password, 10);

  const user = await userModel.create({
    name,
    phone,
    email,
    password: hash,
    role,
  });

  // create jwt token
  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    config.JWT_SECRET,
    {
      expiresIn: "30d",
    },
  );

  res.cookie("token", token);

  res.status(201).json({
    success: true,
    message: "User register successfully",
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
  const { phone, email, password } = req.body;

  const user = await userModel.findOne({
    $or: [{ phone }, { email }],
  });

  if (!user) {
    throw new ApiError(401, "Invalid email or phone number ");
  }

  // validate the password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  // create jwt token
  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    config.JWT_SECRET,
    {
      expiresIn: "30d",
    },
  );

  res.cookie("token", token);

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
  res.clearCookie("token");

  return res.status(200).json({
    success: true,
    message: "User logout successful",
  });
});
