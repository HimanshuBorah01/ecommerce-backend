import dotenv from "dotenv";

dotenv.config();

const env_config = {
  PORT: process.env.PORT || 3000,
  DB_URL: process.env.DB_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY
};

export default env_config;
