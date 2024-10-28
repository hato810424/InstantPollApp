import { FormAnswerData } from "@/pages/polls/@id/Poll";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const answerTable = sqliteTable('answers', {
  poll_id: text().notNull().unique().primaryKey(),
  user_id: text().notNull(),
  data: text({ mode: "json" }).notNull().$type<FormAnswerData[]>()
})

export type answerItem = typeof answerTable.$inferSelect;
export type answerInsert = typeof answerTable.$inferInsert;
