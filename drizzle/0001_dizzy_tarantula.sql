DROP TABLE `audit_logs`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_change_request_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`request_id` integer NOT NULL,
	`target_business_id` text NOT NULL,
	`change_type` text NOT NULL,
	`field_name` text DEFAULT 'BUSINESS_INFO' NOT NULL,
	`before_value` text DEFAULT '' NOT NULL,
	`after_value` text NOT NULL,
	`reason` text NOT NULL,
	`sort_order` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `change_requests`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_change_request_items`("id", "request_id", "target_business_id", "change_type", "field_name", "before_value", "after_value", "reason", "sort_order") SELECT "id", "request_id", "target_business_id", "change_type", "field_name", "before_value", "after_value", "reason", "sort_order" FROM `change_request_items`;--> statement-breakpoint
DROP TABLE `change_request_items`;--> statement-breakpoint
ALTER TABLE `__new_change_request_items` RENAME TO `change_request_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_change_request_items_request` ON `change_request_items` (`request_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `idx_change_request_items_target` ON `change_request_items` (`target_business_id`);--> statement-breakpoint
CREATE TABLE `__new_change_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`request_no` text NOT NULL,
	`title` text NOT NULL,
	`request_area` text NOT NULL,
	`requester_name` text NOT NULL,
	`requester_organization` text NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`row_version` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_change_requests`("id", "request_no", "title", "request_area", "requester_name", "requester_organization", "status", "row_version", "created_at", "updated_at") SELECT "id", "request_no", "title", "request_area", "requester_name", "requester_organization", "status", "row_version", "created_at", "updated_at" FROM `change_requests`;--> statement-breakpoint
DROP TABLE `change_requests`;--> statement-breakpoint
ALTER TABLE `__new_change_requests` RENAME TO `change_requests`;--> statement-breakpoint
CREATE UNIQUE INDEX `uq_change_requests_request_no` ON `change_requests` (`request_no`);--> statement-breakpoint
CREATE INDEX `idx_change_requests_status_created` ON `change_requests` (`status`,`created_at`);