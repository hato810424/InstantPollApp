import "dotenv/config";

import { Hono } from "hono";
import { poweredBy } from "hono/powered-by";
import { deleteCookie, getCookie } from "hono/cookie";

import { dbSqlite } from "../database/drizzle/db";
import { UserItem, userTable } from "../database/drizzle/schema/users";
import { eq } from "drizzle-orm";
import apiRoute from "./api";
import { vike } from "vike-node/hono";

export type Variables = {
  db: ReturnType<typeof dbSqlite>,
  userData: Partial<UserItem> | UserItem,
};

const app = new Hono<{ Variables: Variables }>()

// X-Powered-By: Hono 😎
app.use(poweredBy());

// dbをバックエンドで使えるようにする
app.use(async (c, next) => {
  c.set("db", dbSqlite());
  await next();
});

// Cookieで保存されたUserだったら代入
app.use(async (c, next) => {
  const userId = getCookie(c, "voteUserId");
  
  c.set("userData", {
    id: undefined,
    username: null,
    is_moderator: false,
  })
  
  if (userId) {
    const result = await c.get("db").select().from(userTable).where(eq(userTable.id, userId)).get();

    if (result) {
      c.set("userData", result);
    }
  }

  await next();

  if (! c.get("userData")) {
    deleteCookie(c, "voteUserId");
  }
})

app.route("/", apiRoute);

/**
 * Vike route
 *
 * @link {@see https://vike.dev}
 **/
app.use(vike({
  pageContext: (c) => ({
    db: c.get("db"),
    userData: c.get("userData"),
  }),
  static: {
    root: "./dist/client/"
  }
}));

export default app;
