/**
 * Step 2: exchange an authorization code for a long-lived refresh token.
 *
 * Usage:
 *   node scripts/exchange-refresh-token.js 4/0AXX...
 */
import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const code = process.argv[2];
if (!code) {
  console.error("Usage: node scripts/exchange-refresh-token.js <authorization-code>");
  process.exit(1);
}

const {
  GMAIL_CLIENT_ID: clientId,
  GMAIL_CLIENT_SECRET: clientSecret,
} = process.env;

if (!clientId || !clientSecret) {
  console.error("❌ Missing GMAIL_CLIENT_ID or GMAIL_CLIENT_SECRET in .env");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  "http://localhost",
);

try {
  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.refresh_token) {
    console.error(
      "\n❌ No refresh_token in the response. Google only issues a refresh_token",
    );
    console.error(
      "   the first time a user grants a scope to this client. Re-run the URL with",
    );
    console.error(
      "   `prompt=consent` (or revoke prior access at:",
    );
    console.error(
      "   https://myaccount.google.com/permissions ) and try again.\n",
    );
    process.exit(2);
  }
  console.log("\n✅ Got a new refresh token. Paste this into your .env:\n");
  console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}\n`);
  console.log("Then restart the backend: npm run dev\n");
} catch (err) {
  console.error("\n❌ Failed to exchange code:", err.message);
  if (err.response?.data) {
    console.error("   Google said:", err.response.data);
  }
  process.exit(1);
}
