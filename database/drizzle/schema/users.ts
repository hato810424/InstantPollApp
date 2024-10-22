import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const userTable = sqliteTable('users', {
  id: text("id").notNull().unique().primaryKey(),
  username: text("username").notNull().default("ゲスト")
})

export type UserItem = typeof userTable.$inferSelect;
export type UserInsert = typeof userTable.$inferInsert;
