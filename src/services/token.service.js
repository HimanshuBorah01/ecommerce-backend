import jwt from "jsonwebtoken";
import config from "../config/config.js";
import crypto from "crypto";
import ApiError from "../utils/ApiError.js";

/**
 * Token Service
 *
 * Handles JWT token generation and verification.
 */
class TokenService {
  /**
   * Generate Access Token
   */
  generateAccessToken(user) {
    return jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      config.JWT_SECRET,
      {
        expiresIn: config.JWT_ACCESS_TOKEN_EXPIRES_IN,
      },
    );
  }

  /**
   * Verify Access Token
   */
  verifyAccessToken(accessToken) {
    try {
      return jwt.verify(accessToken, config.JWT_SECRET);
    } catch {
      throw new ApiError(401, "Invalid or expired access token");
    }
  }

  /**
   * Verify Refresh Token
   */
  verifyRefreshToken(refreshToken) {
    try {
      return jwt.verify(refreshToken, config.JWT_SECRET);
    } catch {
      throw new ApiError(401, "Invalid or expired refresh token");
    }
  }

  /**
   * Generate Refresh Token
   */
  generateRefreshToken(user) {
    return jwt.sign(
      {
        id: user._id,
      },
      config.JWT_SECRET,
      {
        expiresIn: config.JWT_REFRESH_TOKEN_EXPIRES_IN,
      },
    );
  }

  /**
   * Hash Refresh Token
   */
  hashRefreshToken(refreshToken) {
    return crypto.createHash("sha256").update(refreshToken).digest("hex");
  }
}

const tokenService = new TokenService();

export default tokenService;
