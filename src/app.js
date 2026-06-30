import express from "express";
import cookieParser from "cookie-parser";
import errorMiddleware from "./middleware/error.middleware.js";

const app = express();
app.use(express.json());
app.use(cookieParser());

//Routes
import authRoutes from "./routes/auth.routes.js";
import productRout from "./routes/product.routes.js";
import cartRouts from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import addressRoutes from "./routes/address.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRout);
app.use("/api/v1/cart", cartRouts);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/addresses", addressRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);

app.use(errorMiddleware);

export default app;
