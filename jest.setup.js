import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import connectToDatabase from "./src/config/db.js";

let mongoServer;

beforeAll(async () => {
  // Create an in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();

  // Get the connection URI
  const uri = mongoServer.getUri();

  // Connect Mongoose using your existing database connection function
  await connectToDatabase(uri);
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
