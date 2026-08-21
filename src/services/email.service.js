import { google } from "googleapis";
import config from "../config/config.js";

const oauth2Client = new google.auth.OAuth2(
  config.GMAIL_CLIENT_ID,
  config.GMAIL_CLIENT_SECRET,
  config.GMAIL_REFRESH_TOKEN,
);

oauth2Client.setCredentials({
  refresh_token: config.GMAIL_REFRESH_TOKEN,
});

const gmail = google.gmail({ version: "v1", auth: oauth2Client });

class EmailService {
  async sendEmail({ to, subject, html }) {
    const from = config.GMAIL_USER;

    const message = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      "Content-Type: text/html; charset=utf-8",
      "",
      html,
    ].join("\n");

    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });
  }

  async sendPasswordResetEmail(email, resetLink) {
    const html = `
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password.</p>
      <p>Click the link below to continue:</p>
      <a href="${resetLink}">
        Reset Password
      </a>
      <p>This link will expire in 15 minutes.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `;

    await this.sendEmail({
      to: email,
      subject: "Reset Your Password",
      html,
    });
  }
}

const emailService = new EmailService();

export default emailService;