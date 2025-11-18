import "dotenv/config";
import { hashPassword } from "../utils/password.js";
import { logger } from "../config/logger.js";
import prisma from "@/config/db.js";

async function run() {
  const gloablPassword = "ChangeMeNow!123";

  const data: { role: string; email: string; password: string }[] = [];

  const superAdminEmail = "superadmin@hrms.local";
  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });
  if (!existingSuperAdmin) {
    const passwordHash = await hashPassword(gloablPassword);
    await prisma.user.create({
      data: {
        email: superAdminEmail,
        passwordHash,
        roles: ["SUPER_ADMIN"],
        isActive: true,
      },
    });
  }
  data.push({
    email: superAdminEmail,
    password: gloablPassword,
    role: "SUPER_ADMIN",
  });
  const employeeEmail1 = "employee1@hrms.local";
  const existingEmployee1 = await prisma.employee.findUnique({
    where: { email: employeeEmail1 },
  });
  if (!existingEmployee1) {
    const emoloyeeCount = await prisma.employee.count();
    await prisma.employee.create({
      data: {
        employeeId: "E-" + emoloyeeCount.toFixed() + 1,
        name: "Nikul",
        email: employeeEmail1,
        phone: "+915656565656",
        status: "active",
      },
    });
  }
  data.push({
    email: employeeEmail1,
    password: gloablPassword,
    role: "EMPLOYEE",
  });
  const employeeEmail2 = "employee2@hrms.local";
  const existingEmployee2 = await prisma.employee.findUnique({
    where: { email: employeeEmail2 },
  });
  if (!existingEmployee2) {
    const emoloyeeCount = await prisma.employee.count();
    await prisma.employee.create({
      data: {
        employeeId: "E-" + emoloyeeCount + 1,
        name: "Nikul",
        email: employeeEmail2,
        phone: "+915656565656",
        status: "active",
      },
    });
  }
  data.push({
    email: employeeEmail2,
    password: gloablPassword,
    role: "EMPLOYEE",
  });
  const managerEmail = "manager@hrms.local";
  const existingManager = await prisma.user.findUnique({
    where: { email: managerEmail },
  });
  if (!existingManager) {
    const passwordHash = await hashPassword(gloablPassword);
    await prisma.user.create({
      data: {
        email: managerEmail,
        passwordHash,
        roles: ["MANAGER"],
        isActive: true,
      },
    });
  }
  data.push({
    email: managerEmail,
    password: gloablPassword,
    role: "MANAGER",
  });
  const hrEmail = "hr@hrms.local";
  const existingHr = await prisma.user.findUnique({
    where: { email: hrEmail },
  });
  if (!existingHr) {
    const passwordHash = await hashPassword(gloablPassword);
    await prisma.user.create({
      data: { email: hrEmail, passwordHash, roles: ["HR"], isActive: true },
    });
  }
  data.push({
    email: hrEmail,
    password: gloablPassword,
    role: "HR",
  });

  const formattedData = data
    .map((d) => `${credsRow(d.role, d.email, d.password)}`)
    .join("\n");
  logger.info(
    "\n" +
      "\n" +
      "ROLE         | EMAIL                     | PASSWORD\n" +
      "-----------------------------------------------------\n" +
      formattedData +
      "\n"
  );
}

function credsRow(role: string, email: string, password: string) {
  return `${role.padEnd(12)} | ${email.padEnd(25)} | ${password}`;
}

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
