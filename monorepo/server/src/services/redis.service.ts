import { Redis } from "ioredis";
import { env } from "../conf/env.js";

if (typeof Redis === "undefined") throw new Error("Redis is not installed");
if (!env.redisUrl) throw new Error("REDIS_URL environment variable is not set");
const redisClient = new Redis(env.redisUrl);

redisClient.on("connect", () => {
  console.log("Redis connected");
});

redisClient.on("error", (err) => {
  console.error("Redis connection error:", err);
});

export default redisClient