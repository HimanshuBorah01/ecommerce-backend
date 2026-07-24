import app from "./src/app.js";
import config from "./src/config/config.js";
import connectToDatabase from "./src/config/db.js";
import { connectRedis } from "./src/config/redis.js";
import redisClient from "./src/config/redis.js";
import mongoose from "mongoose";

// Safely stop the server and close database connections.
async function shutdown(signal, server) {
  console.log(`${signal} received. Shutting down gracefully.`);

  // Force exit if shutdown takes too long.
  const shutdownTimer = setTimeout(() => {
    console.error("Graceful shutdown timed out.");
    process.exit(1);
  }, 10000);
  shutdownTimer.unref();

  // Stop accepting new HTTP requests.
  server.close(async (error) => {
    if (error) {
      console.error("Error while closing server:", error);
      process.exit(1);
    }

    try {
      // Close Redis if it is connected.
      if (redisClient.isOpen) {
        await redisClient.quit();
      }

      // Close MongoDB connection.
      await mongoose.connection.close(false);

      // Shutdown finished before timeout.
      clearTimeout(shutdownTimer);
      console.log("Graceful shutdown complete.");
      process.exit(0);
    } catch (closeError) {
      console.error("Error during graceful shutdown:", closeError);
      process.exit(1);
    }
  });
}

async function startServer() {
  try {
    // Connect to MongoDB before accepting requests.
    await connectToDatabase();

    // Connect to Redis before accepting requests.
    await connectRedis();

    const server = app.listen(config.PORT, () => {
      console.log(`Server is running on port ${config.PORT}`);
    });

    // SIGTERM comes from hosting platforms during deploy/restart.
    process.on("SIGTERM", () => shutdown("SIGTERM", server));
    // SIGINT usually comes from Ctrl+C in terminal.
    process.on("SIGINT", () => shutdown("SIGINT", server));

    return server;
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}
