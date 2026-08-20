CREATE TABLE `userLearningSettings` (
	`userId` int NOT NULL,
	`targetCompletion` int NOT NULL DEFAULT 60,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userLearningSettings_userId` PRIMARY KEY(`userId`)
);
