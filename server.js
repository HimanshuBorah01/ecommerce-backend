import app from "./src/app.js";
import config from "./src/config/config.js";
import connectToDatabase from "./src/config/db.js";
import { connectRedis } from "./src/config/redis.js";

async function startServer() {
  try {
    // Connect to MongoDB before accepting requests.
    await connectToDatabase();

    // Connect to Redis before accepting requests.
    await connectRedis();

    const server = app.listen(config.PORT, () => {
      console.log(`Server is running on port ${config.PORT}`);
    });

    return server;
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}
