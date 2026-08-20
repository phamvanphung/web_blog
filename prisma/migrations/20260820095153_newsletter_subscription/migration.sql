-- CreateTable
CREATE TABLE `NewsletterSubscription` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(200) NOT NULL,
    `ipHash` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `NewsletterSubscription_email_key`(`email`),
    INDEX `NewsletterSubscription_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
