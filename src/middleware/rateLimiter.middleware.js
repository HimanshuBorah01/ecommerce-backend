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
  // Skip rate limiting in development and test so the frontend can iterate
  // without tripping the in-memory counter (once rate-limited, every retry
  // fails and keeps the window exhausted).
  skip: () => ["development", "test"].includes(process.env.NODE_ENV),

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
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => ["development", "test"].includes(process.env.NODE_ENV),

  message: {
    success: false,
    message:
      "Too many authentication attempts. Please try again after 15 minutes.",
  },
});
