CREATE TABLE `login_logs` (
	`id` text PRIMARY KEY,
	`session_id` text NOT NULL,
	`user_id` text NOT NULL,
	`strategy` text NOT NULL,
	`browser` text NOT NULL,
	`device` text NOT NULL,
	`os` text NOT NULL,
	`ip` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `fk_login_logs_session_id_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_login_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `oauth_providers` (
	`id` text PRIMARY KEY,
	`provider_user_id` text NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`strategy` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `fk_oauth_providers_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `passwords` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`password` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()),
	CONSTRAINT `fk_passwords_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `recovery_codes` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`code` text NOT NULL,
	`is_used` integer DEFAULT false,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()),
	CONSTRAINT `fk_recovery_codes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `fk_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY,
	`full_name` text,
	`email` text NOT NULL UNIQUE,
	`normalized_email` text NOT NULL UNIQUE,
	`profile_photo` text,
	`email_verified` integer DEFAULT false NOT NULL,
	`two_factor_enabled` integer DEFAULT false NOT NULL,
	`two_factor_secret` text,
	`is_banned` integer DEFAULT false,
	`ban_reason` text,
	`deleted_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE INDEX `login_logs_user_id_idx` ON `login_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `oauth_providers_user_id_idx` ON `oauth_providers` (`user_id`);--> statement-breakpoint
CREATE INDEX `oauth_providers_provider_user_id_strategy_idx` ON `oauth_providers` (`provider_user_id`,`strategy`);--> statement-breakpoint
CREATE INDEX `passwords_user_id_idx` ON `passwords` (`user_id`);--> statement-breakpoint
CREATE INDEX `recovery_codes_user_id_idx` ON `recovery_codes` (`user_id`);--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `sessions` (`user_id`);