import "dotenv/config";

import { Hono } from "hono";
import { poweredBy } from "hono/powered-by";
import { deleteCookie, getCookie } from "hono/cookie";

import { dbSqlite } from "@/database/drizzle/db";
import { UserItem, userTableDefault } from "@/database/drizzle/schema/users";
import apiRoute from "./api";
import { vike } from "vike-node/hono";
import { getUser } from "@/database/drizzle/queries/users";

export type Variables = {
  db: ReturnType<typeof dbSqlite>,
  userData: typeof userTableDefault,
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
  
  c.set("userData", userTableDefault)
  
  if (userId) {
    const result = await getUser(c.get("db"), userId);

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
