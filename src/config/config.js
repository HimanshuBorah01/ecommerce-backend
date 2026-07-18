import dotenv from "dotenv";

// Load environment variables from .env without extra console noise.
dotenv.config({ quiet: true });

// Read a required environment variable and fail fast if it is missing.
const required = (name) => {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    throw new Error(`${name} is not defined in environment variables.`);
  }

  return value.trim();
};

// Convert required numeric environment variables like PORT.
const number = (name) => {
  const value = Number(required(name));

  if (!Number.isInteger(value)) {
    throw new Error(`${name} must be a valid number.`);
  }

  return value;
};

const nodeEnv = required("NODE_ENV");
const isProduction = nodeEnv === "production";

// Keep NODE_ENV limited to known application modes.
if (!["development", "test", "production"].includes(nodeEnv)) {
  throw new Error("NODE_ENV must be development, test, or production.");
}

const port = number("PORT");
const smtpPort = number("SMTP_PORT");
const jwtSecret = required("JWT_SECRET");
const clientUrl = required("CLIENT_URL");

if (port < 1 || port > 65535) {
  throw new Error("PORT must be between 1 and 65535.");
}

if (smtpPort < 1 || smtpPort > 65535) {
  throw new Error("SMTP_PORT must be between 1 and 65535.");
}

// Extra checks that should only be strict in production.
if (isProduction) {
  if (jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production.");
  }

  if (!clientUrl.startsWith("https://")) {
    throw new Error("CLIENT_URL must use https in production.");
  }
}

// Central config object used by the rest of the app.
const config = {
  PORT: port,
  DB_URL: required("DB_URL"),
  JWT_SECRET: jwtSecret,

  IMAGEKIT_PRIVATE_KEY: required("IMAGEKIT_PRIVATE_KEY"),
  RAZORPAY_KEY_ID: required("RAZORPAY_KEY_ID"),
  RAZORPAY_KEY_SECRET: required("RAZORPAY_KEY_SECRET"),

  REDIS_URL: required("REDIS_URL"),

  JWT_ACCESS_TOKEN_EXPIRES_IN: required("JWT_ACCESS_TOKEN_EXPIRES_IN"),
  JWT_REFRESH_TOKEN_EXPIRES_IN: required("JWT_REFRESH_TOKEN_EXPIRES_IN"),
  NODE_ENV: nodeEnv,
  IS_PRODUCTION: isProduction,
  CLIENT_URL: clientUrl,

  SMTP_HOST: required("SMTP_HOST"),
  SMTP_PORT: smtpPort,
  SMTP_SECURE: smtpPort === 465,
  SMTP_USER: required("SMTP_USER"),
  SMTP_PASS: required("SMTP_PASS"),
  SMTP_FROM: required("SMTP_FROM"),
};

export default config;
