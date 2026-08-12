import {sql} from "drizzle-orm";
import {index,integer,sqliteTable,text,uniqueIndex} from "drizzle-orm/sqlite-core";

export const changeRequests=sqliteTable("change_requests",{
 id:integer("id").primaryKey({autoIncrement:true}),
 requestNo:text("request_no").notNull(),title:text("title").notNull(),requestArea:text("request_area").notNull(),
 requesterName:text("requester_name").notNull(),requesterOrganization:text("requester_organization").notNull(),
 status:text("status").notNull().default("DRAFT"),rowVersion:integer("row_version").notNull().default(1),
 createdAt:text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),updatedAt:text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
},t=>[uniqueIndex("uq_change_requests_request_no").on(t.requestNo),index("idx_change_requests_status_created").on(t.status,t.createdAt)]);

export const changeRequestItems=sqliteTable("change_request_items",{
 id:integer("id").primaryKey({autoIncrement:true}),requestId:integer("request_id").notNull().references(()=>changeRequests.id,{onDelete:"cascade"}),
 targetBusinessId:text("target_business_id").notNull(),changeType:text("change_type").notNull(),fieldName:text("field_name").notNull().default("BUSINESS_INFO"),
 beforeValue:text("before_value").notNull().default(""),afterValue:text("after_value").notNull(),reason:text("reason").notNull(),sortOrder:integer("sort_order").notNull().default(1)
},t=>[index("idx_change_request_items_request").on(t.requestId,t.sortOrder),index("idx_change_request_items_target").on(t.targetBusinessId)]);

export const sbfVersions=sqliteTable("sbf_versions",{
 id:integer("id").primaryKey({autoIncrement:true}),versionNo:text("version_no").notNull(),status:text("status").notNull().default("PUBLISHED"),
 publishedAt:text("published_at").notNull().default(sql`CURRENT_TIMESTAMP`),publisherName:text("publisher_name").notNull(),reason:text("reason").notNull().default(""),
 itemCount:integer("item_count").notNull(),sourceFile:text("source_file").notNull(),sourceSheet:text("source_sheet").notNull().default("1. IA"),snapshotHash:text("snapshot_hash").notNull()
},t=>[uniqueIndex("uq_sbf_versions_no").on(t.versionNo),uniqueIndex("uq_sbf_versions_hash").on(t.snapshotHash),index("idx_sbf_versions_published").on(t.publishedAt)]);
