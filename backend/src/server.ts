import { env } from "@/config/env";
import createApp from "@/app";
import connectDB from "@/infra/db";

const port = env.PORT;

const main = async () => {
  await connectDB();

  const app = createApp();
  const serverInstance = app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });

  serverInstance.on("error", (error) => {
    console.error("Server failed to start:", error);
    process.exit(1);
  });
};

main().catch((error) => {
  console.error("MongoDB connection failed:", error);
  process.exit(1);
});