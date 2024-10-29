import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const userTable = sqliteTable('users', {
  id: text().notNull().unique().primaryKey(),
  username: text(),
  is_moderator: integer({ mode: "boolean" }).notNull().default(false),
  hostname: text().notNull(),
})

export const selectUserTable = {
  id: userTable.id,
  username: userTable.username,
  is_moderator: userTable.is_moderator,
}

export type UserItem = typeof userTable.$inferSelect;
export type UserInsert = typeof userTable.$inferInsert;
