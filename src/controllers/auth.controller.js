import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import userModel from "../models/user.model.js";
import config from "../config/config.js";

/**
 * Register a new user
@param {import("express").Request}req
@param {import("express").Response} res 
*/
// Register a new user
async function registerUser(req, res) {
  try {
    const { name, phone, email, password, role = "user" } = req.body;

    const isUserAlreadyExist = await userModel.findOne({
      $or: [{ phone }, { email }],
    });

    if (isUserAlreadyExist) {
      return res.status(409).json({
        success: false,
        message: "User with this phone number or email already exist",
      });
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
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Login user
async function loginUser(req, res) {
  try {
    const { phone, email, password } = req.body;

    const user = await userModel.findOne({
      $or: [{ phone }, { email }],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or phone number ",
      });
    }

    // validate the password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
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
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Logout user
async function logoutUser(req, res) {
  res.clearCookie("token");

  return res.status(200).json({
    success: true,
    message: "User logout successful",
  });
}

export const authController = { registerUser, loginUser, logoutUser };
