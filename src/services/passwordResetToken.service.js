import crypto from "crypto";
import PasswordResetToken from "../models/passwordResetToken.model.js";

/**
 * Password Reset Token Service
 */
class PasswordResetTokenService {
  /**
   * Generate a secure reset token.
   */
  generateToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Hash a reset token.
   */
  hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Create password reset token.
   */
  async createToken(userId) {
    // Generate raw token
    const token = this.generateToken();

    // Hash token
    const tokenHash = this.hashToken(token);

    // Remove previous reset token if it exists
    await PasswordResetToken.deleteOne({
      user: userId,
    });

    // Save new token
    await PasswordResetToken.create({
      user: userId,
      tokenHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    });

    return token;
  }

  /**
   * Find reset token.
   */
  async findToken(token) {
    const tokenHash = this.hashToken(token);

    return PasswordResetToken.findOne({
      tokenHash,
    });
  }

  /**
   * Delete reset token.
   */
  async deleteToken(userId) {
    return PasswordResetToken.deleteOne({
      user: userId,
    });
  }
}

const passwordResetTokenService = new PasswordResetTokenService();

export default passwordResetTokenService;
