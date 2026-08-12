CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`occurred_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`actor_name` text NOT NULL,
	`actor_role` text NOT NULL,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`result` text DEFAULT 'SUCCESS' NOT NULL,
	`correlation_id` text NOT NULL,
	`detail_json` text DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_logs_occurred` ON `audit_logs` (`occurred_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_target` ON `audit_logs` (`target_type`,`target_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_audit_logs_correlation` ON `audit_logs` (`correlation_id`);--> statement-breakpoint
CREATE TABLE `change_request_items` (
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
CREATE INDEX `idx_change_request_items_request` ON `change_request_items` (`request_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `idx_change_request_items_target` ON `change_request_items` (`target_business_id`);--> statement-breakpoint
CREATE TABLE `change_requests` (
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
CREATE UNIQUE INDEX `uq_change_requests_request_no` ON `change_requests` (`request_no`);--> statement-breakpoint
CREATE INDEX `idx_change_requests_status_created` ON `change_requests` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `sbf_versions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`version_no` text NOT NULL,
	`status` text DEFAULT 'PUBLISHED' NOT NULL,
	`published_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`publisher_name` text NOT NULL,
	`reason` text DEFAULT '' NOT NULL,
	`item_count` integer NOT NULL,
	`source_file` text NOT NULL,
	`source_sheet` text DEFAULT '1. IA' NOT NULL,
	`snapshot_hash` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_sbf_versions_no` ON `sbf_versions` (`version_no`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_sbf_versions_hash` ON `sbf_versions` (`snapshot_hash`);--> statement-breakpoint
CREATE INDEX `idx_sbf_versions_published` ON `sbf_versions` (`published_at`);