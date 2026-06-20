CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(255) NOT NULL,
	`resource` varchar(255) NOT NULL,
	`resourceId` int,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`timestamp` bigint NOT NULL,
	`tasksCompleted` int NOT NULL DEFAULT 0,
	`activeMembers` int NOT NULL DEFAULT 0,
	`responseTime` decimal(10,2) NOT NULL DEFAULT '0',
	`throughput` decimal(10,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`leaderId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users_teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`teamId` int NOT NULL,
	`role` enum('Admin','TeamLeader','Member') NOT NULL DEFAULT 'Member',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('Admin','TeamLeader','Member','user','admin') NOT NULL DEFAULT 'Member';