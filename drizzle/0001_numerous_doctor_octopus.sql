CREATE TABLE `attemptAnswers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attemptId` int NOT NULL,
	`userId` int NOT NULL,
	`questionId` varchar(100) NOT NULL,
	`sequenceNo` int NOT NULL,
	`selectedOption` varchar(1) NOT NULL,
	`correctOptionSnapshot` varchar(1) NOT NULL,
	`isCorrect` int NOT NULL,
	`markedReviewError` varchar(32),
	`answeredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attemptAnswers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`mode` varchar(32) NOT NULL,
	`questionCount` int NOT NULL,
	`correctCount` int NOT NULL DEFAULT 0,
	`wrongCount` int NOT NULL DEFAULT 0,
	`score` int NOT NULL DEFAULT 0,
	`passed80` int NOT NULL DEFAULT 0,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`questionId` varchar(100) NOT NULL,
	`sourceKey` varchar(32) NOT NULL,
	`sourceSection` varchar(120) NOT NULL,
	`sourceQuestionNo` varchar(32) NOT NULL,
	`sourcePage` int,
	`category` varchar(80),
	`questionText` text NOT NULL,
	`optionA` text NOT NULL,
	`optionB` text NOT NULL,
	`optionC` text NOT NULL,
	`optionD` text NOT NULL,
	`correctOption` varchar(1) NOT NULL,
	`explanation` text,
	`enabled` int NOT NULL DEFAULT 1,
	`requiresMedia` int NOT NULL DEFAULT 0,
	`sourceRaw` text,
	`sourceUrl` text,
	`importStatus` varchar(32) NOT NULL DEFAULT 'imported',
	`verified` int NOT NULL DEFAULT 0,
	`notes` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `questions_id` PRIMARY KEY(`id`),
	CONSTRAINT `questions_questionId_unique` UNIQUE(`questionId`)
);
--> statement-breakpoint
CREATE TABLE `reviewNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questionId` varchar(100) NOT NULL,
	`noteType` varchar(32) NOT NULL,
	`noteText` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviewNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` varchar(80) NOT NULL,
	`value` text NOT NULL,
	`notes` text,
	CONSTRAINT `settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `wrongQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questionId` varchar(100) NOT NULL,
	`wrongCount` int NOT NULL DEFAULT 1,
	`consecutiveCorrect` int NOT NULL DEFAULT 0,
	`status` varchar(20) NOT NULL DEFAULT '待複習',
	`migrationStatus` varchar(24) NOT NULL DEFAULT 'matched',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wrongQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` varchar(16) NOT NULL DEFAULT 'user';