import { env } from "@/config/env";
import { server } from "@/app";

const port = env.PORT || 8000;

const main = async () => {
  const serverInstance = server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });

  serverInstance.on("error", (error) => {
    console.error("Server failed to start:", error);
    process.exit(1);
  });
};

main().catch((error) => {
  console.error("Server startup failed:", error);
  process.exit(1);
});
