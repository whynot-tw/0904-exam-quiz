CREATE TABLE `officialQuestionConciseExplanations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`questionId` varchar(100) NOT NULL,
	`summary` text NOT NULL,
	`memoryTip` text NOT NULL,
	`sourceNotice` text NOT NULL,
	`model` varchar(80) NOT NULL,
	`generationCount` int NOT NULL DEFAULT 1,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `officialQuestionConciseExplanations_id` PRIMARY KEY(`id`),
	CONSTRAINT `officialQuestionConciseExplanations_question_unique` UNIQUE(`questionId`)
);
