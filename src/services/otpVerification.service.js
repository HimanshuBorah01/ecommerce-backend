import config from "../config/config.js";
import emailService from "./email.service.js";
import otpVerificationTokenService from "./otpVerificationToken.service.js";

class OtpVerificationService {
  async sendVerificationEmail(user) {
    const otp = await otpVerificationTokenService.createOtp(user._id);

    const html = `
      <h2>Verify Your Email</h2>
      <p>Welcome ${user.name},</p>
      <p>Your email verification OTP is:</p>
      <h1 style="font-size: 32px; letter-spacing: 8px; text-align: center; background: #f0f0f0; padding: 16px; border-radius: 8px;">${otp}</h1>
      <p>This OTP will expire in 10 minutes.</p>
      <p>If you didn't create this account, you can ignore this email.</p>
    `;

    await emailService.sendEmail({
      to: user.email,
      subject: "Verify Your Email - OTP",
      html,
    });
  }
}

const otpVerificationService = new OtpVerificationService();

export default otpVerificationService;