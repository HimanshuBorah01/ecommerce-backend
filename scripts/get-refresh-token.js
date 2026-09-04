/**
 * Step 1 of generating a Gmail refresh token.
 *
 * Prints a Google consent URL for the configured GMAIL_CLIENT_ID and exits.
 * The user grants access, copies the `code` from the redirect URL, then runs:
 *   node scripts/exchange-refresh-token.js <code>
 *
 * Usage:
 *   node scripts/get-refresh-token.js
 */
import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const {
  GMAIL_CLIENT_ID: clientId,
  GMAIL_CLIENT_SECRET: clientSecret,
} = process.env;

if (!clientId || !clientSecret) {
  console.error(
    "❌ Missing GMAIL_CLIENT_ID or GMAIL_CLIENT_SECRET in .env — add them first, then re-run.",
  );
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  "http://localhost",
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent", // forces Google to return a new refresh token
  scope: [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.compose",
  ],
});

console.log("\n📧 Generate a NEW Gmail refresh token (client:", clientId, ")\n");
console.log("BEFORE you click the link, double-check this in Google Cloud Console:");
console.log("  1. APIs & Services → OAuth consent screen");
console.log("     → Publishing status = 'In production'");
console.log("     (If it's 'Testing', tokens can be revoked without notice.)");
console.log("  2. APIs & Services → Credentials → your OAuth Client ID");
console.log("     → Authorized redirect URIs must include: http://localhost\n");
console.log("Then open this URL, sign in as the GMAIL_USER, and grant access:\n");
console.log(`  ${authUrl}\n`);
console.log("After clicking 'Allow' you'll be sent to a localhost URL that won't load.");
console.log("From the address bar copy the value of the `code` parameter and run:\n");
console.log("  node scripts/exchange-refresh-token.js <paste-the-code-here>\n");
