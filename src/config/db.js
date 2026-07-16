import mongoose from "mongoose";
import config from "./config.js";

async function connectToDatabase(dbURL = config.DB_URL) {

  try {
    await mongoose.connect(dbURL);
    console.log("MongoDB connected successfully.");
  } catch (err) {
    console.error("Database connection failed:", err);
    throw err;
  }
}

export default connectToDatabase;
