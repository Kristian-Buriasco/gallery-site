ALTER TABLE `photos` ADD `placeholder` text;
--> statement-breakpoint
ALTER TABLE `photos` ADD `alt_text` text;
--> statement-breakpoint
ALTER TABLE `photos` ADD `content_hash` text;
--> statement-breakpoint
ALTER TABLE `galleries` ADD `cover_focus_x` integer DEFAULT 50 NOT NULL;
--> statement-breakpoint
ALTER TABLE `galleries` ADD `cover_focus_y` integer DEFAULT 50 NOT NULL;
--> statement-breakpoint
ALTER TABLE `galleries` ADD `pin_enabled` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `galleries` ADD `pin_hash` text;
--> statement-breakpoint
ALTER TABLE `view_events` ADD `photo_id` text REFERENCES `photos`(`id`) ON DELETE set null;
