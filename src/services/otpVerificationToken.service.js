import crypto from "crypto";
import EmailVerificationToken from "../models/emailVerificationToken.model.js";

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const OTP_GENERATION_LIMIT = 5;
const OTP_GENERATION_WINDOW_MS = 60 * 60 * 100; // 6 minutes

class OtpVerificationTokenService {
  generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  hashOtp(otp) {
    return crypto.createHash("sha256").update(otp).digest("hex");
  }

  async createOtp(userId) {
    const now = new Date();
    const recentOtpCount = await EmailVerificationToken.countDocuments({
      user: userId,
      createdAt: { $gte: new Date(now.getTime() - OTP_GENERATION_WINDOW_MS) },
    });

    if (recentOtpCount >= OTP_GENERATION_LIMIT) {
      throw new Error(
        "Too many OTP requests. Please try again after some time."
      );
    }

    const otp = this.generateOtp();
    const otpHash = this.hashOtp(otp);

    await EmailVerificationToken.deleteOne({ user: userId });

    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);

    await EmailVerificationToken.create({
      user: userId,
      otpHash,
      expiresAt,
    });

    return otp;
  }

  async findOtp(otp) {
    const otpHash = this.hashOtp(otp);

    return EmailVerificationToken.findOne({
      otpHash,
      expiresAt: { $gt: new Date() },
    });
  }

  async deleteOtp(userId) {
    return EmailVerificationToken.deleteOne({ user: userId });
  }
}

const otpVerificationTokenService = new OtpVerificationTokenService();

export default otpVerificationTokenService;