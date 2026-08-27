CREATE TABLE `questionIssueReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questionId` varchar(100) NOT NULL,
	`issueType` varchar(32) NOT NULL DEFAULT '內容疑似有誤',
	`note` text,
	`reviewStatus` varchar(24) NOT NULL DEFAULT '待核對',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `questionIssueReports_id` PRIMARY KEY(`id`),
	CONSTRAINT `questionIssueReports_user_question_unique` UNIQUE(`userId`,`questionId`)
);
--> statement-breakpoint
CREATE INDEX `questionIssueReports_user_status_idx` ON `questionIssueReports` (`userId`,`reviewStatus`);