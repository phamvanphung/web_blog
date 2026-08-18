-- CreateIndex
CREATE INDEX `Menu_location_idx` ON `Menu`(`location`);

-- CreateIndex
CREATE INDEX `Page_status_updatedAt_idx` ON `Page`(`status`, `updatedAt`);

-- CreateIndex
CREATE INDEX `Post_deletedAt_status_publishedAt_idx` ON `Post`(`deletedAt`, `status`, `publishedAt`);

-- CreateIndex
CREATE INDEX `Post_status_updatedAt_idx` ON `Post`(`status`, `updatedAt`);
