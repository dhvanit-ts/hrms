import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

// Prevent multiple instances in development (hot-reload)
const prisma = global.prisma || new PrismaClient();
global.prisma = prisma;

export default prisma;
