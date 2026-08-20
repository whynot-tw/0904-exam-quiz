CREATE TABLE `classificationReviewBatches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminUserId` int NOT NULL,
	`questionIdsJson` text NOT NULL,
	`beforeStatesJson` text NOT NULL,
	`appliedSubcategory` varchar(80) NOT NULL,
	`appliedStatus` varchar(32) NOT NULL,
	`appliedNotes` text,
	`restoredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `classificationReviewBatches_id` PRIMARY KEY(`id`)
);
