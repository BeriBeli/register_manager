CREATE TABLE `address_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`memory_map_id` text NOT NULL,
	`name` text NOT NULL,
	`display_name` text,
	`description` text,
	`base_address` text NOT NULL,
	`range` text NOT NULL,
	`width` integer NOT NULL,
	`usage` text DEFAULT 'register' NOT NULL,
	`volatile` integer DEFAULT false,
	`type_identifier` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`memory_map_id`) REFERENCES `memory_maps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `enumerated_values` (
	`id` text PRIMARY KEY NOT NULL,
	`field_id` text NOT NULL,
	`name` text NOT NULL,
	`display_name` text,
	`description` text,
	`value` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`field_id`) REFERENCES `fields`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `fields` (
	`id` text PRIMARY KEY NOT NULL,
	`register_id` text NOT NULL,
	`name` text NOT NULL,
	`display_name` text,
	`description` text,
	`bit_offset` integer NOT NULL,
	`bit_width` integer NOT NULL,
	`volatile` integer DEFAULT false,
	`type_identifier` text,
	`access` text DEFAULT 'read-write',
	`modified_write_value` text,
	`read_action` text,
	`testable` integer DEFAULT true,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`register_id`) REFERENCES `registers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `memory_maps` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`display_name` text,
	`description` text,
	`address_unit_bits` integer DEFAULT 8 NOT NULL,
	`shared` integer DEFAULT false,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`display_name` text,
	`description` text,
	`vlnv` text NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `register_files` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text NOT NULL,
	`parent_type` text NOT NULL,
	`name` text NOT NULL,
	`display_name` text,
	`description` text,
	`address_offset` text NOT NULL,
	`range` text NOT NULL,
	`type_identifier` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `registers` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text NOT NULL,
	`parent_type` text NOT NULL,
	`name` text NOT NULL,
	`display_name` text,
	`description` text,
	`address_offset` text NOT NULL,
	`size` integer NOT NULL,
	`volatile` integer DEFAULT false,
	`type_identifier` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `resets` (
	`id` text PRIMARY KEY NOT NULL,
	`field_id` text NOT NULL,
	`reset_type_ref` text,
	`value` text NOT NULL,
	`mask` text,
	`created_at` integer,
	FOREIGN KEY (`field_id`) REFERENCES `fields`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`password_hash` text NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);