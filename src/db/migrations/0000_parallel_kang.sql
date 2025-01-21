CREATE TABLE `login_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`sessionId` text NOT NULL,
	`userId` text NOT NULL,
	`strategy` text NOT NULL,
	`browser` text NOT NULL,
	`device` text NOT NULL,
	`os` text NOT NULL,
	`ip` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `login_logs_user_id_idx` ON `login_logs` (`userId`);--> statement-breakpoint
CREATE TABLE `login_methods` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`method` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `login_method_user_id_idx` ON `login_methods` (`userId`);--> statement-breakpoint
CREATE TABLE `oauth_providers` (
	`id` text PRIMARY KEY NOT NULL,
	`providerUserId` text NOT NULL,
	`userId` text NOT NULL,
	`email` text NOT NULL,
	`strategy` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `oauth_providers_user_id_idx` ON `oauth_providers` (`userId`);--> statement-breakpoint
CREATE INDEX `oauth_providers_provider_user_id_strategy_idx` ON `oauth_providers` (`providerUserId`,`strategy`);--> statement-breakpoint
CREATE TABLE `passwords` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`password` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `passwords_user_id_idx` ON `passwords` (`userId`);--> statement-breakpoint
CREATE TABLE `recovery_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`code` text NOT NULL,
	`isUsed` integer DEFAULT false,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `recovery_codes_user_id_idx` ON `recovery_codes` (`userId`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`expiresAt` integer NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`fullName` text,
	`email` text NOT NULL,
	`normalizedEmail` text NOT NULL,
	`profilePhoto` text,
	`emailVerified` integer DEFAULT false NOT NULL,
	`twoFactorEnabled` integer DEFAULT false NOT NULL,
	`twoFactorSecret` text,
	`isBanned` integer DEFAULT false,
	`banReason` text,
	`isDeleted` integer DEFAULT false,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_normalizedEmail_unique` ON `users` (`normalizedEmail`);