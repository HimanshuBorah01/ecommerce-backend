import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import config from "./config/config.js";
import errorMiddleware from "./middleware/error.middleware.js";
import { apiRateLimiter } from "./middleware/rateLimiter.middleware.js";

import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import addressRoutes from "./routes/address.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";

const app = express();

// Hide Express from response headers.
app.disable("x-powered-by");

// Trust the first proxy only in production deployments.
app.set("trust proxy", config.IS_PRODUCTION ? 1 : false);

// Only this frontend URL can access the API from a browser.
const allowedOrigins = new Set([config.CLIENT_URL]);

// Handles browser CORS checks before API routes run.
const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    // Tell the browser this frontend origin is allowed.
    res.setHeader("Access-Control-Allow-Origin", origin);
    // Allow cookies and auth credentials in browser requests.
    res.setHeader("Access-Control-Allow-Credentials", "true");
    // Allow frontend to send JSON and Bearer tokens.
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    // Allow the HTTP methods used by this API.
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    );
    // Tell caches the response depends on the Origin header.
    res.setHeader("Vary", "Origin");
  }

  // Browser preflight request ends here.
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
};

// Logs one JSON line after every request completes.
const requestLogger = (req, res, next) => {
  if (config.NODE_ENV === "test") {
    return next();
  }

  // Used later to calculate request duration.
  const startedAt = Date.now();

  res.on("finish", () => {
    const statusCode = res.statusCode;
    // Pick log level based on final response status.
    const level =
      statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";

    console.log(
      JSON.stringify({
        level,
        message: "request completed",
        method: req.method,
        path: req.originalUrl,
        statusCode,
        durationMs: Date.now() - startedAt,
        ip: req.ip,
      }),
    );
  });

  next();
};

// Security HTTP headers
app.use(helmet());
app.use(corsMiddleware);
app.use(requestLogger);

// Health check for deployment platforms and uptime checks.
app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// General API rate limiter
app.use("/api", apiRateLimiter);
// Limit request body size to protect server memory.
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/addresses", addressRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);

app.use(errorMiddleware);

export default app;
