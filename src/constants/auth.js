/**
 * Authentication constants
 * Centralized authentication-related values.
 */
export const AUTH = {
  // JWT
  JWT_COOKIE_NAME: "accessToken",
  JWT_HEADER_PREFIX: "Bearer",

  // Token Expiry
  ACCESS_TOKEN_EXPIRES_IN: "7d",

  // Password
  PASSWORD_MIN_LENGTH: 6,

  // User Roles
  DEFAULT_ROLE: "user",
};
