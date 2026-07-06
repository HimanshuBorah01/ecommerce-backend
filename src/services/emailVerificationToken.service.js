import crypto from "crypto";
import EmailVerificationToken from "../models/emailVerificationToken.model.js";

/**
 * Email Verification Token Service
 */
class EmailVerificationTokenService {
  /**
   * Generate a secure verification token.
   */
  generateToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Hash verification token.
   */
  hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Create verification token.
   */
  async createToken(userId) {
    // Generate raw token
    const token = this.generateToken();

    // Hash token
    const tokenHash = this.hashToken(token);

    // Remove previous verification token
    await EmailVerificationToken.deleteOne({
      user: userId,
    });

    // Save new token
    await EmailVerificationToken.create({
      user: userId,
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    return token;
  }

  /**
   * Find verification token.
   */
  async findToken(token) {
    const tokenHash = this.hashToken(token);

    return EmailVerificationToken.findOne({
      tokenHash,
    });
  }

  /**
   * Delete verification token.
   */
  async deleteToken(userId) {
    return EmailVerificationToken.deleteOne({
      user: userId,
    });
  }
}

const emailVerificationTokenService = new EmailVerificationTokenService();

export default emailVerificationTokenService;
