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

  /**
   * Sends a "thank you for subscribing" welcome email to a new
   * newsletter subscriber. Best-effort: failures are logged by the
   * caller so a temporary email outage never blocks subscription.
   */
  async sendNewsletterWelcomeEmail(email) {
    const html = this.buildNewsletterWelcomeHtml(email);

    await this.sendEmail({
      to: email,
      subject: "Thank you for subscribing to Shopy!",
      html,
    });
  }

  buildNewsletterWelcomeHtml(email) {
    const year = new Date().getFullYear();
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Shopy Newsletter</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Inter',Arial,sans-serif;color:#111827;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.08);overflow:hidden;">
    <tr>
      <td style="background:#FF5A1F;padding:28px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;">Shopy</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:40px 32px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <div style="width:64px;height:64px;background:#dcfce7;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="#16a34a" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;text-align:center;color:#111827;">Thank you for subscribing!</h2>
              <p style="margin:0 0 8px;font-size:15px;line-height:24px;text-align:center;color:#4b5563;">
                Hello <strong style="color:#111827;">${email}</strong>,
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:24px;text-align:center;color:#6b7280;">
                You're now on the list. Get ready for exclusive offers, deals, and product updates straight to your inbox.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center">
              <a href="https://ecommerce-frontend-two-ruby.vercel.app/" style="display:inline-block;background:#FF5A1F;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:8px;font-size:15px;">Start Shopping</a>
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;text-align:center;font-size:12px;color:#9ca3af;">
              <p style="margin:0;">&copy; ${year} Shopy E-commerce Pvt. Ltd. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}

const emailService = new EmailService();

export default emailService;