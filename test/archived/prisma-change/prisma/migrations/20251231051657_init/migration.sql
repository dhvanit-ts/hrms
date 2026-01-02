-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin', 'superadmin');

-- CreateEnum
CREATE TYPE "AuthType" AS ENUM ('oauth', 'manual');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "roles" "Role"[] DEFAULT ARRAY['user']::"Role"[],
    "authType" "AuthType" NOT NULL DEFAULT 'manual',
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
