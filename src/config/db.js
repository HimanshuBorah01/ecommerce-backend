import mongoose from "mongoose";
import config from "./config.js";

async function connectToDatabase() {
  const dbURL = config.DB_URL;

  try {
    await mongoose.connect(dbURL);
    console.log("database is connect successfully");
  } catch (err) {
    console.log("database connect error", err);
  }
}

export default connectToDatabase;
