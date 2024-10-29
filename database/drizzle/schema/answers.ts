import { FormAnswerData } from "@/pages/polls/@id/Poll";
import { sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const answerTable = sqliteTable('answers', {
  poll_id: text().notNull(),
  user_id: text().notNull(),
  data: text({ mode: "json" }).notNull().$type<FormAnswerData[]>()
}, (t) => ({
  poll_user_unique: unique().on(t.poll_id, t.user_id),
}))

export type answerItem = typeof answerTable.$inferSelect;
export type answerInsert = typeof answerTable.$inferInsert;
