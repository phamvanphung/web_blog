-- CreateTable
CREATE TABLE `Popup` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `htmlContent` LONGTEXT NOT NULL,
    `triggerType` ENUM('ALL', 'HOMEPAGE', 'PATH') NOT NULL DEFAULT 'ALL',
    `triggerPaths` JSON NULL,
    `frequency` ENUM('ALWAYS', 'ONCE') NOT NULL DEFAULT 'ONCE',
    `delaySeconds` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `notes` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `Popup_status_triggerType_idx`(`status`, `triggerType`),
    INDEX `Popup_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
