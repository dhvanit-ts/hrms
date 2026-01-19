/*
  Warnings:

  - You are about to drop the `attendance_correction_requests` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `attendance_correction_requests`;

-- CreateTable
CREATE TABLE `Ticket` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticketNumber` VARCHAR(191) NOT NULL,
    `employeeId` INTEGER NOT NULL,
    `type` ENUM('attendance_correction', 'extra_leave_request', 'profile_change_request') NOT NULL,
    `category` ENUM('late_checkin', 'early_checkout', 'missing_checkin', 'missing_checkout', 'wrong_attendance_type', 'emergency_leave', 'extended_leave', 'unpaid_leave', 'personal_info', 'employment_details', 'shift_change', 'department_transfer', 'job_role_change', 'salary_adjustment', 'contact_details') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `priority` ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
    `status` ENUM('pending', 'under_review', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
    `approverId` INTEGER NULL,
    `approverNotes` TEXT NULL,
    `attendanceId` INTEGER NULL,
    `requestedDate` DATETIME(3) NULL,
    `requestedCheckIn` DATETIME(3) NULL,
    `requestedCheckOut` DATETIME(3) NULL,
    `leaveType` VARCHAR(191) NULL,
    `leaveStartDate` DATETIME(3) NULL,
    `leaveEndDate` DATETIME(3) NULL,
    `leaveDays` INTEGER NULL,
    `profileChanges` JSON NULL,
    `metadata` JSON NULL,
    `attachments` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `approvedAt` DATETIME(3) NULL,
    `rejectedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Ticket_ticketNumber_key`(`ticketNumber`),
    INDEX `Ticket_employeeId_idx`(`employeeId`),
    INDEX `Ticket_approverId_idx`(`approverId`),
    INDEX `Ticket_attendanceId_idx`(`attendanceId`),
    INDEX `Ticket_status_idx`(`status`),
    INDEX `Ticket_type_idx`(`type`),
    INDEX `Ticket_category_idx`(`category`),
    INDEX `Ticket_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TicketComment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticketId` INTEGER NOT NULL,
    `authorId` INTEGER NOT NULL,
    `authorType` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `isInternal` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TicketComment_ticketId_idx`(`ticketId`),
    INDEX `TicketComment_authorId_authorType_idx`(`authorId`, `authorType`),
    INDEX `TicketComment_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
