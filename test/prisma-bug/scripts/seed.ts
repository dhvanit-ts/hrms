import prisma from "../src/infra/db/index";
import { hashPassword } from "../src/lib/crypto";

async function run() {
  const globalPassword = "ChangeMeNow!123";
  const userEmail = "user@app.local";

  const existingUser = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!existingUser) {
    const passwordHash = await hashPassword(globalPassword);

    await UserModel.create({
      email: userEmail,
      password: passwordHash,
      username: "defaultuser",
      authType:"manual",
      roles: ["superadmin"],
    });

    console.log("Seeded USER:", userEmail, "password:", globalPassword);
  } else {
    console.log(
      "USER already exists with credentials:",
      userEmail,
      "password:",
      globalPassword
    );
  }

  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
