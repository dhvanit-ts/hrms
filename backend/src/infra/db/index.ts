import mongoose from "mongoose";
import { DB_NAME } from "@/shared/constants/db";

const connectDB = async () => {
  try {
   const connectionString = process.env.DATABASE_URL;
   if (!connectionString) throw new Error("DATABASE_URL is not set");
   
   const finalConnectionString =
    process.env.NODE_ENV === "production" && DB_NAME
      ? `${connectionString}/${DB_NAME}`
      : connectionString;
    await mongoose.connect(finalConnectionString);
    console.log("MongoDB connected");
  } catch (error) {
    console.log("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;