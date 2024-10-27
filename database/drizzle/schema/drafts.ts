import { FormComponent } from "@/pages/poll/create/+Page";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const draftTable = sqliteTable('drafts', {
  id: text().notNull().unique().primaryKey(),
  data: text({ mode: "json" }).$type<FormComponent>()
})

export type DraftItem = typeof draftTable.$inferSelect;
export type DraftInsert = typeof draftTable.$inferInsert;
