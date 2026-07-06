import nodemailer from "nodemailer";
import config from "../config/config.js";

/**
 * Email Service
 */
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });
  }

  /**
   * Send an email.
   */
  async sendEmail({ to, subject, html }) {
    return this.transporter.sendMail({
      from: config.SMTP_FROM,
      to,
      subject,
      html,
    });
  }

  /**
   * Send password reset email.
   */
  async sendPasswordResetEmail(email, resetLink) {
    return this.sendEmail({
      to: email,
      subject: "Reset Your Password",
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password.</p>
        <p>Click the link below to continue:</p>
        <a href="${resetLink}">
          Reset Password
        </a>
        <p>This link will expire in 15 minutes.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    });
  }
}

const emailService = new EmailService();

export default emailService;
