import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";

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
// Security HTTP headers
app.use(helmet());
// General API rate limiter
app.use("/api", apiRateLimiter);
app.use(express.json());
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
