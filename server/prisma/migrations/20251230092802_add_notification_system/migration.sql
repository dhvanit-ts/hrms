-- CreateTable
CREATE TABLE `events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(191) NOT NULL,
    `actorId` INTEGER NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `targetType` VARCHAR(191) NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `events_type_idx`(`type`),
    INDEX `events_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `receiverId` INTEGER NOT NULL,
    `receiverType` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `targetType` VARCHAR(191) NOT NULL,
    `actors` JSON NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 1,
    `state` ENUM('unread', 'delivered', 'seen') NOT NULL DEFAULT 'unread',
    `aggregationKey` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deliveredAt` DATETIME(3) NULL,
    `seenAt` DATETIME(3) NULL,

    INDEX `notifications_receiverId_receiverType_idx`(`receiverId`, `receiverType`),
    INDEX `notifications_state_idx`(`state`),
    INDEX `notifications_createdAt_idx`(`createdAt`),
    UNIQUE INDEX `notifications_receiverId_receiverType_aggregationKey_key`(`receiverId`, `receiverType`, `aggregationKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
