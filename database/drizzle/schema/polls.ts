import { FormComponent } from "@/pages/poll/create/+Page";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const pollTable = sqliteTable('polls', {
  id: text().notNull().unique().primaryKey(),
  author_id: text().notNull(),
  data: text({ mode: "json" }).notNull().$type<FormComponent>()
})

export type PollItem = typeof pollTable.$inferSelect;
export type PollInsert = typeof pollTable.$inferInsert;
