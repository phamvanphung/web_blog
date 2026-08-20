-- CreateTable
CREATE TABLE `CategoryGroup` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(80) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isProtected` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CategoryGroup_slug_key`(`slug`),
    INDEX `CategoryGroup_sortOrder_idx`(`sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `Category` ADD COLUMN `groupId` VARCHAR(191) NULL,
    ADD COLUMN `hidden` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `Category_groupId_hidden_idx` ON `Category`(`groupId`, `hidden`);

-- AddForeignKey
ALTER TABLE `Category` ADD CONSTRAINT `Category_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `CategoryGroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- SeedData (idempotent — INSERT IGNORE so re-running is safe)
INSERT IGNORE INTO `CategoryGroup` (`id`, `slug`, `name`, `sortOrder`, `isProtected`, `createdAt`, `updatedAt`)
VALUES ('grp_default', 'default', 'Default', 0, true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
