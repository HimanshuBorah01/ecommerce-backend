import nodemailer from "nodemailer";
import config from "../config/config.js";

const RESEND_API_URL = "https://api.resend.com/emails";

class EmailService {
  constructor() {
    this.useApi = !!config.EMAIL_API_KEY;

    if (!this.useApi) {
      this.transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_SECURE,
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS,
        },
      });
      if (process.env.NODE_ENV !== "test") {
        this.verifyConnection();
      }
    }
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log("SMTP server connection verified.");
    } catch (error) {
      console.error("SMTP server connection failed:", error.message);
    }
  }

  async sendEmail({ to, subject, html }) {
    if (this.useApi) {
      return this.sendViaApi({ to, subject, html });
    }
    return this.sendViaSmtp({ to, subject, html });
  }

  async sendViaApi({ to, subject, html }) {
    const payload = {
      from: config.SMTP_FROM,
      to,
      subject,
      html,
    };

    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.EMAIL_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Email API error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  async sendViaSmtp({ to, subject, html }) {
    try {
      return await this.transporter.sendMail({
        from: config.SMTP_FROM,
        to,
        subject,
        html,
      });
    } catch (error) {
      throw new Error("Failed to send email", { cause: error });
    }
  }

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
