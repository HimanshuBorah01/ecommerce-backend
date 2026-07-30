import { createClient } from "redis";
import config from "./config.js";

// Create one Redis client using the REDIS_URL from config.
const redisClient = createClient({
  url: config.REDIS_URL,
});

// These events help us understand the Redis connection status.
redisClient.on("connect", () => {
  console.log("Redis client connecting...");
});

redisClient.on("ready", () => {
  console.log("Redis client connected successfully.");
});

redisClient.on("error", (error) => {
  console.error("Redis connection error:", error);
});

redisClient.on("end", () => {
  console.log("Redis connection closed.");
});

// Connect Redis before the server starts accepting requests.
async function connectRedis() {
  await redisClient.connect();
}

export { connectRedis };
export default redisClient;
