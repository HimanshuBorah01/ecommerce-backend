import dotenv from "dotenv";

dotenv.config({ quiet: true });

const required = (name) => {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`${name} is not defined in environment variables.`);
  }
  return value.trim();
};

const optional = (name, fallback = "") => {
  const value = process.env[name];
  return value && value.trim() !== "" ? value.trim() : fallback;
};

const number = (name) => {
  const value = Number(required(name));
  if (!Number.isInteger(value)) {
    throw new Error(`${name} must be a valid number.`);
  }
  return value;
};

const nodeEnv = required("NODE_ENV");
const isProduction = nodeEnv === "production";

if (!["development", "test", "production"].includes(nodeEnv)) {
  throw new Error("NODE_ENV must be development, test, or production.");
}

const port = number("PORT");
const jwtSecret = required("JWT_SECRET");
const clientUrl = required("CLIENT_URL");

if (port < 1 || port > 65535) {
  throw new Error("PORT must be between 1 and 65535.");
}

if (isProduction) {
  if (jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production.");
  }
  if (!clientUrl.startsWith("https://")) {
    throw new Error("CLIENT_URL must use https in production.");
  }
}

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

  GMAIL_CLIENT_ID: optional("GMAIL_CLIENT_ID"),
  GMAIL_CLIENT_SECRET: optional("GMAIL_CLIENT_SECRET"),
  GMAIL_REFRESH_TOKEN: optional("GMAIL_REFRESH_TOKEN"),
  GMAIL_USER: optional("GMAIL_USER"),
};

if (nodeEnv !== "test") {
  required("GMAIL_CLIENT_ID");
  required("GMAIL_CLIENT_SECRET");
  required("GMAIL_REFRESH_TOKEN");
  required("GMAIL_USER");
}

export default config;
