import "dotenv/config";
import mongoose, { Types } from "mongoose";
import { User } from "../models/User.js";
import { hashPassword } from "../utils/password.js";
import { loadEnv } from "../config/env.js";
import { Employee } from "../models/Employee.js";

async function run() {
  const env = loadEnv();
  await mongoose.connect(env.MONGO_URI);
  const gloablPassword = "ChangeMeNow!123";
  const superAdminEmail = "superadmin@hrms.local";
  const existingSuperAdmin = await User.findOne({ email: superAdminEmail });
  if (!existingSuperAdmin) {
    const passwordHash = await hashPassword(gloablPassword);
    await User.create({
      email: superAdminEmail,
      passwordHash,
      roles: ["SUPER_ADMIN"],
      isActive: true,
    });
    console.log(
      "Seeded SUPER_ADMIN:",
      superAdminEmail,
      "password: ",
      gloablPassword
    );
  } else {
    console.log(
      "SUPER_ADMIN already exists with creds:",
      superAdminEmail,
      "password: ",
      gloablPassword
    );
  }
  const employeeEmail1 = "employee1@hrms.local";
  const existingEmployee1 = await Employee.findOne({ email: employeeEmail1 });
  if (!existingEmployee1) {
    const emoloyeeCount = await Employee.countDocuments();
    await Employee.create({
      employeeId: "E-" + emoloyeeCount + 1,
      name: "Nikul",
      email: employeeEmail1,
      phone: "+915656565656",
      status: "active",
    });
    console.log(
      "Seeded EMPLOYEE:",
      employeeEmail1,
      "password: ",
      gloablPassword
    );
  } else {
    console.log(
      "EMPLOYEE already exists with creds:",
      employeeEmail1,
      "password: ",
      gloablPassword
    );
  }
  const employeeEmail2 = "employee2@hrms.local";
  const existingEmployee2 = await Employee.findOne({ email: employeeEmail2 });
  if (!existingEmployee2) {
    const emoloyeeCount = await Employee.countDocuments();
    await Employee.create({
      employeeId: "E-" + emoloyeeCount + 1,
      name: "Nikul",
      email: employeeEmail2,
      phone: "+915656565656",
      status: "active",
    });
    console.log(
      "Seeded EMPLOYEE:",
      employeeEmail2,
      "password: ",
      gloablPassword
    );
  } else {
    console.log(
      "EMPLOYEE already exists with creds:",
      employeeEmail2,
      "password: ",
      gloablPassword
    );
  }
  const managerEmail = "manager@hrms.local";
  const existingManager = await User.findOne({ email: managerEmail });
  if (!existingManager) {
    const passwordHash = await hashPassword(gloablPassword);
    await User.create({
      email: managerEmail,
      passwordHash,
      roles: ["MANAGER"],
      isActive: true,
    });
    console.log("Seeded MANAGER:", managerEmail, "password: ", gloablPassword);
  } else {
    console.log(
      "MANAGER already exists with creds:",
      managerEmail,
      "password: ",
      gloablPassword
    );
  }
  const hrEmail = "hr@hrms.local";
  const existingHr = await User.findOne({ email: hrEmail });
  if (!existingHr) {
    const passwordHash = await hashPassword(gloablPassword);
    await User.create({
      email: hrEmail,
      passwordHash,
      roles: ["HR"],
      isActive: true,
    });
    console.log("Seeded HR:", hrEmail, "password: ", gloablPassword);
  } else {
    console.log(
      "HR already exists with creds:",
      hrEmail,
      "password: ",
      gloablPassword
    );
  }
  await mongoose.disconnect();
}

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
