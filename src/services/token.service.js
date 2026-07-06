import jwt from "jsonwebtoken";
import config from "../config/config.js";

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
        expiresIn: config.JWT_EXPIRES_IN,
      },
    );
  }
}

const tokenService = new TokenService();

export default tokenService;
