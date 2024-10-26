import "dotenv/config";

import { Hono } from "hono";
import { poweredBy } from "hono/powered-by";
import { deleteCookie, getCookie } from "hono/cookie";

import { dbSqlite } from "../database/drizzle/db";
import { UserItem, userTable } from "../database/drizzle/schema/users";
import { eq } from "drizzle-orm";
import apiRoute from "./api";
import { renderPage } from "vike/server";
import { PageContext } from "vike/types";

export type Variables = {
  db: ReturnType<typeof dbSqlite>,
  userData: undefined | UserItem,
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
app.all("*", async (c) => {
  const pageContextInit = {
    db: c.get("db"),
    userData: c.get("userData"),

    urlOriginal: c.req.url,
    headersOriginal: c.req.header()
  } satisfies Variables | PageContext;

  const pageContext = await renderPage(pageContextInit);
  const response = pageContext.httpResponse;

  const { readable, writable } = new TransformStream();
  response.pipe(writable);

  return new Response(readable, {
    status: response.statusCode,
    headers: response.headers,
  });
});

export default app;
