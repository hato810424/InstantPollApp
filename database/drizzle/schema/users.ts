import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const userTable = sqliteTable('users', {
  id: text("id").notNull().unique().primaryKey(),
  username: text("username"),
  is_moderator: integer({ mode: "boolean" }).default(false),
})

export type UserItem = typeof userTable.$inferSelect;
export type UserInsert = typeof userTable.$inferInsert;
