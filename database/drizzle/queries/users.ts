import { userTable } from "../schema/users";
import { type dbSqlite } from "../db";
import { eq } from "drizzle-orm";

export function getUser(db: ReturnType<typeof dbSqlite>, userId: string) {
  return db.select().from(userTable).where(eq(userTable.id, userId)).get();
}
