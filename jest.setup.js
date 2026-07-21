import { jest } from "@jest/globals";
jest.setTimeout(60000);
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import connectToDatabase from "./src/config/db.js";
import { connectRedis } from "./src/config/redis.js";
import redisClient from "./src/config/redis.js";

let mongoServer;

beforeAll(async () => {
  // Create an in-memory MongoDB replica set so transactions can run in tests.
  mongoServer = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
    },
  });

  // Get the connection URI
  const uri = mongoServer.getUri();

  // Connect Mongoose using your existing database connection function
  await connectToDatabase(uri);

  // Connect Redis for integration tests
  await connectRedis();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;

  for (const collection of Object.values(collections)) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  if (redisClient.isOpen) {
    await redisClient.quit();
  }

  // Close the Mongoose connection
  await mongoose.connection.close();

  // Stop the in-memory MongoDB server
  await mongoServer.stop();
});
