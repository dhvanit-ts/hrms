-- AlterTable
ALTER TABLE `Attendance` ADD COLUMN `shiftId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Employee` ADD COLUMN `shiftId` INTEGER NULL;

-- CreateTable
CREATE TABLE `Shift` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `breakTime` INTEGER NOT NULL DEFAULT 60,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Shift_name_key`(`name`),
    INDEX `Shift_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Attendance_shiftId_idx` ON `Attendance`(`shiftId`);

-- CreateIndex
CREATE INDEX `Employee_shiftId_idx` ON `Employee`(`shiftId`);
