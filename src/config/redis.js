import { createClient } from "redis";
import config from "./config.js";

const redisClient = createClient({
  url: config.REDIS_URL,
});

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

async function connectRedis() {
  await redisClient.connect();
}

export { connectRedis };
export default redisClient;
