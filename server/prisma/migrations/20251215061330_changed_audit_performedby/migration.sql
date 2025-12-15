/*
  Warnings:

  - You are about to alter the column `performedBy` on the `audit_logs` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- AlterTable
ALTER TABLE `audit_logs` MODIFY `performedBy` INTEGER NULL;
