CREATE TABLE `likes` (
	`photo_id` text NOT NULL,
	`liker_token` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`photo_id`, `liker_token`),
	FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `view_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gallery_id` text NOT NULL,
	`visitor_id` text,
	`kind` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`gallery_id`) REFERENCES `galleries`(`id`) ON UPDATE no action ON DELETE cascade
);
