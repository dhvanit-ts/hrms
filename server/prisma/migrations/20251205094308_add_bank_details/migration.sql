-- CreateTable
CREATE TABLE `BankDetails` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employeeId` INTEGER NOT NULL,
    `accountNumber` VARCHAR(191) NOT NULL,
    `bankName` VARCHAR(191) NOT NULL,
    `branchName` VARCHAR(191) NULL,
    `ifscCode` VARCHAR(191) NOT NULL,
    `accountType` VARCHAR(191) NOT NULL DEFAULT 'savings',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BankDetails_employeeId_key`(`employeeId`),
    INDEX `BankDetails_employeeId_idx`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
