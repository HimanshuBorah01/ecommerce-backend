import rateLimit from "express-rate-limit";

/**
 * General API rate limiter.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

/**
 * Authentication rate limiter.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 115,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many authentication attempts. Please try again after 15 minutes.",
  },
});
