CREATE TABLE `wrongQuestionConciseExplanations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questionId` varchar(100) NOT NULL,
	`summary` text NOT NULL,
	`memoryTip` text NOT NULL,
	`feedback` varchar(20),
	`feedbackAt` timestamp,
	`generationCount` int NOT NULL DEFAULT 1,
	`model` varchar(80) NOT NULL,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wrongQuestionConciseExplanations_id` PRIMARY KEY(`id`),
	CONSTRAINT `wrongQuestionConciseExplanations_user_question_unique` UNIQUE(`userId`,`questionId`)
);
