import config from "../config/config.js";

/**
 * Cookie options for authentication cookies.
 * Shared by login, refresh token, and logout.
 */
const cookieOptions = {
  httpOnly: true,
  secure: config.IS_PRODUCTION,
  sameSite: config.IS_PRODUCTION ? "none" : "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: "/",
};

export default cookieOptions;
