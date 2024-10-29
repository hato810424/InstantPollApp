import { FormComponent } from "@/pages/poll/create/+Page";
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const pollTable = sqliteTable('polls', {
  id: text().notNull().unique().primaryKey(),
  author_id: text().notNull(),
  data: text({ mode: "json" }).notNull().$type<FormComponent>(),
  // https://orm.drizzle.team/docs/guides/timestamp-default-value
  created_at: integer().notNull().default(sql`(unixepoch())`),
  closed_at: integer(),
})

// Hono RPCでDate型を渡せない問題について
// https://github.com/honojs/hono/issues/1800

export type PollItem = typeof pollTable.$inferSelect;
export type PollInsert = typeof pollTable.$inferInsert;
