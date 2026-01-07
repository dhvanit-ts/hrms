-- CreateTable
CREATE TABLE `attendance_correction_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employeeId` INTEGER NOT NULL,
    `attendanceId` INTEGER NOT NULL,
    `requestType` ENUM('CHECK_IN_TIME', 'CHECK_OUT_TIME', 'BOTH_TIMES', 'MISSING_CHECK_IN', 'MISSING_CHECK_OUT') NOT NULL,
    `requestedCheckIn` DATETIME(3) NULL,
    `requestedCheckOut` DATETIME(3) NULL,
    `currentCheckIn` DATETIME(3) NULL,
    `currentCheckOut` DATETIME(3) NULL,
    `reason` TEXT NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `reviewerId` INTEGER NULL,
    `reviewerNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `reviewedAt` DATETIME(3) NULL,

    INDEX `attendance_correction_requests_employeeId_idx`(`employeeId`),
    INDEX `attendance_correction_requests_attendanceId_idx`(`attendanceId`),
    INDEX `attendance_correction_requests_status_idx`(`status`),
    INDEX `attendance_correction_requests_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
