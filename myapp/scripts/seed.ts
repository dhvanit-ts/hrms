import { eq } from "drizzle-orm";
import db from "../src/infra/db/index";
import { UserTable } from "../src/infra/db/tables/user.table";
import { hashPassword } from "../src/lib/crypto";

async function run() {
  const globalPassword = "ChangeMeNow!123";
  const userEmail = "user@app.local";

  const existingUser = await db
    .select()
    .from(UserTable)
    .where(eq(UserTable.email, userEmail));

  if (existingUser.length === 0) {
    const passwordHash = await hashPassword(globalPassword);

    await db.insert(UserTable).values({
      email: userEmail,
      password: passwordHash,
      username: "defaultuser",
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
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
