CREATE TABLE `starredQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questionId` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `starredQuestions_id` PRIMARY KEY(`id`),
	CONSTRAINT `starredQuestions_user_question_unique` UNIQUE(`userId`,`questionId`)
);
