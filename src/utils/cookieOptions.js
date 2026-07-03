import config from "../config/config.js";

const cookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

export default cookieOptions;
