ALTER TABLE `questions` ADD `subcategory` varchar(80);--> statement-breakpoint
ALTER TABLE `questions` ADD `subcategoryStatus` varchar(32) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `questions` ADD `subcategoryNotes` text;