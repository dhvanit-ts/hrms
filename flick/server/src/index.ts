import connectDB from "./db/index.js"
import { server } from "./app.js"
import { EventEmitter } from "node:events";
import { env } from "./conf/env.js";

EventEmitter.defaultMaxListeners = 20; // or whatever makes sense

console.log("💡 Starting app...");

console.log("env.port:", env.port);
console.log("process.env.PORT:", process.env.PORT);

console.log("Trying to connect to Mongo...");

connectDB().then(() => {
  console.log("✅ Mongo connected");
  const port = parseInt(process.env.PORT || "3000", 10);
  server.listen(port, () => {
    console.log(`🚀 Server is listening on ${port}`);
  });
  server.on("error", (err) => {
    console.error("🔥 Server error:", err);
  });
}).catch((err) => {
  console.error("❌ Mongo connection failed:", err);
});
