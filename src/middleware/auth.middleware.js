import jwt from "jsonwebtoken";

import userModel from "../models/user.model.js";
import config from "../config/config.js";

// verify the user is valid or not
async function protect(req, res, next) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized token",
      });
    }

    // verify the token and find id
    const decode = jwt.verify(token, config.JWT_SECRET);
    const user = await userModel.findById(decode.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
}

// verify user is seller or not
function sellerOnly(req, res, next) {
  if (req.user.role !== "seller") {
    return res.status(403).json({
      success: false,
      message: "You don't have access",
    });
  }

  next();
}

// verify user is normal user or not
function userOnly(req, res, next) {
  if (req.user.role !== "user") {
    return res.status(403).json({
      success: false,
      message: "You don't have access",
    });
  }
  next();
}

export const authMiddleware = {
  protect,
  sellerOnly,
  userOnly,
};
