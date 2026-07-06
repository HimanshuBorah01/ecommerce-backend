import jwt from "jsonwebtoken";
import config from "../config/config.js";
import crypto from "crypto";

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
   * Verify Refresh Token
   */
  verifyRefreshToken(refreshToken) {
    return jwt.verify(refreshToken, config.JWT_SECRET);
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
