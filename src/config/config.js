import dotenv from "dotenv";

dotenv.config();

if (!process.env.PORT) {
  throw new Error("PORT is not defined in environment variables.");
}
if (!process.env.DB_URL) {
  throw new Error("DB_URL is not defined in environment variables.");
}
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables.");
}
if (!process.env.IMAGEKIT_PRIVATE_KEY) {
  throw new Error(
    "IMAGEKIT_PRIVATE_KEY is not defined in environment variables.",
  );
}
if (!process.env.RAZORPAY_KEY_ID) {
  throw new Error("RAZORPAY_KEY_ID is not defined in environment variables.");
}
if (!process.env.RAZORPAY_KEY_SECRET) {
  throw new Error(
    "RAZORPAY_KEY_SECRET is not defined in environment variables.",
  );
}
if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is not defined in environment variables.");
}
if (!process.env.JWT_ACCESS_TOKEN_EXPIRES_IN) {
  throw new Error(
    "JWT_ACCESS_TOKEN_EXPIRES_IN is not defined in environment variables.",
  );
}
if (!process.env.JWT_REFRESH_TOKEN_EXPIRES_IN) {
  throw new Error(
    "JWT_REFRESH_TOKEN_EXPIRES_IN is not defined in environment variables.",
  );
}
if (!process.env.NODE_ENV) {
  throw new Error("NODE_ENV is not defined in environment variables.");
}
if (!process.env.CLIENT_URL) {
  throw new Error("CLIENT_URL is not defined in environment variables.");
}
if (!process.env.SMTP_HOST) {
  throw new Error("SMTP_HOST is not defined in environment variables.");
}
if (!process.env.SMTP_PORT) {
  throw new Error("SMTP_PORT is not defined in environment variables.");
}
if (!process.env.SMTP_USER) {
  throw new Error("SMTP_USER is not defined in environment variables.");
}
if (!process.env.SMTP_PASS) {
  throw new Error("SMTP_PASS is not defined in environment variables.");
}
if (!process.env.SMTP_FROM) {
  throw new Error("SMTP_FROM is not defined in environment variables.");
}

const config = {
  PORT: Number(process.env.PORT),
  DB_URL: process.env.DB_URL,
  JWT_SECRET: process.env.JWT_SECRET,

  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  
  REDIS_URL: process.env.REDIS_URL,

  JWT_ACCESS_TOKEN_EXPIRES_IN: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN,
  JWT_REFRESH_TOKEN_EXPIRES_IN: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN,
  NODE_ENV: process.env.NODE_ENV,
  IS_PRODUCTION: process.env.NODE_ENV === "production",
  CLIENT_URL: process.env.CLIENT_URL,

  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: Number(process.env.SMTP_PORT),
  SMTP_SECURE: Number(process.env.SMTP_PORT) === 465,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM,
};

export default config;
