CREATE TABLE `muscle_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `muscle_groups_name_idx` ON `muscle_groups` (`name`);
--> statement-breakpoint
CREATE TABLE `equipment` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `equipment_name_idx` ON `equipment` (`name`);
--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`muscle_group_id` text,
	`equipment_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`muscle_group_id`) REFERENCES `muscle_groups`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`equipment_id`) REFERENCES `equipment`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `exercises_name_idx` ON `exercises` (`name`);
--> statement-breakpoint
CREATE INDEX `exercises_deleted_idx` ON `exercises` (`deleted_at`);
--> statement-breakpoint
CREATE TABLE `splits` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`is_preset` integer DEFAULT false NOT NULL,
	`source_preset_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`archived_at` text
);
--> statement-breakpoint
CREATE INDEX `splits_preset_idx` ON `splits` (`is_preset`,`archived_at`);
--> statement-breakpoint
CREATE TABLE `split_days` (
	`id` text PRIMARY KEY NOT NULL,
	`split_id` text NOT NULL,
	`name` text NOT NULL,
	`position` integer NOT NULL,
	`weekday` integer,
	FOREIGN KEY (`split_id`) REFERENCES `splits`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `split_days_split_idx` ON `split_days` (`split_id`,`position`);
--> statement-breakpoint
CREATE INDEX `split_days_weekday_idx` ON `split_days` (`split_id`,`weekday`);
--> statement-breakpoint
CREATE TABLE `template_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`split_day_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`position` integer NOT NULL,
	`target_sets` integer NOT NULL,
	`rep_min` integer NOT NULL,
	`rep_max` integer NOT NULL,
	`target_reps` integer NOT NULL,
	`current_weight` real NOT NULL,
	`increment` real NOT NULL,
	FOREIGN KEY (`split_day_id`) REFERENCES `split_days`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `template_exercises_day_idx` ON `template_exercises` (`split_day_id`,`position`);
--> statement-breakpoint
CREATE TABLE `workout_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`split_id` text,
	`split_name` text NOT NULL,
	`split_day_id` text,
	`split_day_name` text NOT NULL,
	`started_at` text NOT NULL,
	`completed_at` text,
	`updated_at` text NOT NULL,
	CONSTRAINT "sessions_status_check" CHECK("workout_sessions"."status" in ('in_progress', 'completed', 'abandoned'))
);
--> statement-breakpoint
CREATE INDEX `sessions_status_started_idx` ON `workout_sessions` (`status`,`started_at`);
--> statement-breakpoint
CREATE INDEX `sessions_completed_idx` ON `workout_sessions` (`completed_at`);
--> statement-breakpoint
CREATE TABLE `session_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`position` integer NOT NULL,
	`exercise_id` text,
	`exercise_name` text NOT NULL,
	`muscle_group_name` text,
	`equipment_name` text,
	`target_sets` integer NOT NULL,
	`rep_min` integer NOT NULL,
	`rep_max` integer NOT NULL,
	`prescribed_weight` real NOT NULL,
	`prescribed_reps` integer NOT NULL,
	`increment` real NOT NULL,
	`template_exercise_id` text,
	`recommendation_reason` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `workout_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `session_exercises_session_idx` ON `session_exercises` (`session_id`,`position`);
--> statement-breakpoint
CREATE INDEX `session_exercises_exercise_idx` ON `session_exercises` (`exercise_id`);
--> statement-breakpoint
CREATE TABLE `exercise_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`session_exercise_id` text NOT NULL,
	`set_index` integer NOT NULL,
	`weight` real,
	`reps` integer,
	`completed_at` text,
	FOREIGN KEY (`session_exercise_id`) REFERENCES `session_exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `exercise_sets_exercise_idx` ON `exercise_sets` (`session_exercise_id`,`set_index`);
--> statement-breakpoint
CREATE TABLE `personal_records` (
	`id` text PRIMARY KEY NOT NULL,
	`exercise_id` text NOT NULL,
	`weight` real NOT NULL,
	`reps` integer NOT NULL,
	`estimated_one_rep_max` real NOT NULL,
	`achieved_at` text NOT NULL,
	`session_id` text NOT NULL,
	`set_id` text NOT NULL,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `personal_records_exercise_idx` ON `personal_records` (`exercise_id`,`achieved_at`);
--> statement-breakpoint
CREATE TABLE `body_measurements` (
	`id` text PRIMARY KEY NOT NULL,
	`metric` text NOT NULL,
	`value` real NOT NULL,
	`unit` text NOT NULL,
	`measured_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `body_measurements_metric_idx` ON `body_measurements` (`metric`,`measured_at`);
