import mongoose from "mongoose";
import UserModel from "../src/infra/db/models/user.model";
import { hashPassword } from "../src/lib/crypto";
import { env } from "../src/config/env";

async function run() {
  await mongoose.connect(env.DATABASE_URL);
  const globalPassword = "ChangeMeNow!123";
  const userEmail = "user@app.local";
  const existingSuperAdmin = await UserModel.findOne({
    email: userEmail,
  });
  if (!existingSuperAdmin) {
    const passwordHash = await hashPassword(globalPassword);
    await UserModel.create({
      email: userEmail,
      passwordHash,
      username: "defaultuser",
    });
    console.log("Seeded USER:", userEmail, "password: ", globalPassword);
  } else {
    console.log(
      "USER already exists with credentials:",
      userEmail,
      "password: ",
      globalPassword
    );
  }
  await mongoose.disconnect();
}

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
