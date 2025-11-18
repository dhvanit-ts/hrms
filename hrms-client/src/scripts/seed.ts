import prisma from "@/common/config/db";
import { hashPassword } from "@/utils/password";

async function run() {
  const globalPassword = "ChangeMeNow!123";
  const userEmail = "user@app.local";

  const existingUser = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!existingUser) {
    const passwordHash = await hashPassword(globalPassword);

    await prisma.user.create({
      data: {
        email: userEmail,
        password: passwordHash,
        username: "defaultuser",
      },
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
