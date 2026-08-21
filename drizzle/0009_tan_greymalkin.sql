CREATE TABLE `accountDataMigrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceUserId` int NOT NULL,
	`targetUserId` int NOT NULL,
	`scopeJson` text NOT NULL,
	`sourceCountsJson` text NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accountDataMigrations_id` PRIMARY KEY(`id`)
);
