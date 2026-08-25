CREATE TABLE `csvExportHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` varchar(20) NOT NULL,
	`columnKeysJson` text NOT NULL,
	`startDate` varchar(10),
	`endDate` varchar(10),
	`courseType` varchar(32),
	`subcategory` varchar(80),
	`questionCount` int NOT NULL,
	`estimatedBytes` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `csvExportHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `csvExportHistory_user_created_idx` ON `csvExportHistory` (`userId`,`createdAt`);