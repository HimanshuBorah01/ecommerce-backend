import config from "../config/config.js";
import emailService from "./email.service.js";
import emailVerificationTokenService from "./emailVerificationToken.service.js";

/**
 * Email Verification Service
 */
class EmailVerificationService {
  /**
   * Send email verification link.
   */
  async sendVerificationEmail(user) {
    // Generate verification token
    const token = await emailVerificationTokenService.createToken(user._id);

    // Create verification link
    const verificationLink = `${config.CLIENT_URL}/verify-email?token=${token}`;

    // Send email
    await emailService.sendEmail({
      to: user.email,
      subject: "Verify Your Email",
      html: `
        <h2>Verify Your Email</h2>
        <p>Welcome ${user.name},</p>
        <p>Please verify your email address by clicking the link below.</p>

        <a href="${verificationLink}">
          Verify Email
        </a>

        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create this account, you can ignore this email.</p>
      `,
    });
  }
}

const emailVerificationService = new EmailVerificationService();

export default emailVerificationService;
