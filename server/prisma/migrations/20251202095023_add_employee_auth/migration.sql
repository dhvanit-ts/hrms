-- AlterTable
ALTER TABLE `Employee` ADD COLUMN `lastLogin` DATETIME(3) NULL,
    ADD COLUMN `passwordHash` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `EmployeeRefreshToken` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jti` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,
    `employeeId` INTEGER NOT NULL,

    UNIQUE INDEX `EmployeeRefreshToken_jti_key`(`jti`),
    INDEX `EmployeeRefreshToken_employeeId_idx`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
