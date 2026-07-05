import bcrypt from "bcryptjs";
import userModel from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import generateToken from "../utils/generateToken.js";
import cookieOptions from "../utils/cookieOptions.js";

/**
 * Register a new user
@param {import("express").Request}req
@param {import("express").Response} res 
*/
// Register a new user
export const registerUser = asyncHandler(async (req, res) => {
  const { name, phone, email, password } = req.body;

  const userExists = await userModel.findOne({
    $or: [{ phone }, { email }],
  });

  if (userExists) {
    throw new ApiError(
      409,
      "User with this phone number or email already exist",
    );
  }

  // Hash password before saving
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await userModel.create({
    name,
    phone,
    email,
    password: hashedPassword,
    role: "user",
  });

  // generate authentication token
  const token = generateToken(user);

  res.cookie("token", token, cookieOptions);

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

  const user = await userModel
    .findOne({
      $or: [{ phone }, { email }],
    })
    .select("+password");

  // Check if user exists
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Validate password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  // generate authentication token
  const token = generateToken(user);

  res.cookie("token", token, cookieOptions);

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
