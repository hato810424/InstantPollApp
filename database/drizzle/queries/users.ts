import { selectUserTable, userTable } from "../schema/users";
import { type dbSqlite } from "../db";
import { eq, inArray } from "drizzle-orm";

export function getUser(db: ReturnType<typeof dbSqlite>, userId: string, allColumns?: boolean) {
  if (allColumns === true) {
    return db.select().from(userTable).where(eq(userTable.id, userId)).get();
  } else {
    return db.select(selectUserTable).from(userTable).where(eq(userTable.id, userId)).get();
  }
}

export function getUsers(db: ReturnType<typeof dbSqlite>, userIds: string[]) {
  return db.select(selectUserTable).from(userTable).where(inArray(userTable.id, userIds)).execute();
}
