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
const config = {
  PORT: Number(process.env.PORT),
  DB_URL: process.env.DB_URL,
  JWT_SECRET: process.env.JWT_SECRET,

  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,

  JWT_ACCESS_TOKEN_EXPIRES_IN: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN,
  JWT_REFRESH_TOKEN_EXPIRES_IN: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN,
  NODE_ENV: process.env.NODE_ENV,
  IS_PRODUCTION: process.env.NODE_ENV === "production",
};

export default config;
