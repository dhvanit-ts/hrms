import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import { env } from "../conf/env.js";

const connectDB = async () => {
  try {
    const connectionString =
      env.environment === "production"
        ? `${env.mongoUrl}${DB_NAME}`
        : env.mongoUrl;
    if (!connectionString) {
      throw new Error("MONGODB_URI is not defined");
    }
    const db = await mongoose.connect(connectionString, {
      connectTimeoutMS: 10000,
    });
    console.log(`MongoDB connected to ${db.connection.host}`);
  } catch (error) {
    console.log("MongoDB connection error: ", error);
    process.exit(1);
  }
};

export default connectDB;
