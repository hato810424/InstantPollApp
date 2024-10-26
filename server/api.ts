import { Hono } from "hono";
import { zValidator } from '@hono/zod-validator'
import z from "zod";
import { HTTPException } from "hono/http-exception";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

import { userTable } from "../database/drizzle/schema/users";
import { eq } from "drizzle-orm";

import * as uuid from "uuid";

import { Variables } from "./index";

const app = new Hono<{ Variables: Variables }>();

const handler = app
  .get(
    "/api/@me",
    async (c) => {
      const userId = getCookie(c, "voteUserId");
      if (userId) {
        const result = await c.get("db").select().from(userTable).where(eq(userTable.id, userId)).get();
    
        if (result) {
          return c.json(result);
        }

        deleteCookie(c, "voteUserId");
      }
      
      throw new HTTPException(404);
    }
  )
  .put(
    "/api/@me",
    zValidator(
      'form',
      z.object({
        username: z.string(),
      }),
    ),
    async (c) => {
      const userId = getCookie(c, "voteUserId");

      if (userId) {
        const result = await c.get("db").select().from(userTable).where(eq(userTable.id, userId)).execute();
        if (result[0]) {
          const insertResult = await c.get("db").update(userTable).set({
            username: c.req.valid("form").username,
          }).where(eq(userTable.id, userId)).execute()
          
          return c.json(insertResult);
        }
      }
      
      const id = uuid.v7();
      
      const insertResult = await c.get("db").insert(userTable).values({
        id: id,
        username: c.req.valid("form").username,
      }).execute();

      c.set("userData", {
        id: id,
        username: c.req.valid("form").username
      })

      setCookie(c, "voteUserId", id);

      return c.json(insertResult);
    }
  );

export default app;
export type AppType = typeof handler;
