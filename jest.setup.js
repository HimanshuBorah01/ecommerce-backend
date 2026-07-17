import { jest } from "@jest/globals";
jest.setTimeout(60000);
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import connectToDatabase from "./src/config/db.js";
import { connectRedis } from "./src/config/redis.js";

let mongoServer;

beforeAll(async () => {
  // Create an in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();

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

  // Close the Mongoose connection
  await mongoose.connection.close();

  // Stop the in-memory MongoDB server
  await mongoServer.stop();
});
