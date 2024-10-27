import { Hono } from "hono";
import { zValidator } from '@hono/zod-validator'
import z from "zod";
import { HTTPException } from "hono/http-exception";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

import { userTable } from "../database/drizzle/schema/users";
import { eq } from "drizzle-orm";

import * as uuid from "uuid";

import { Variables } from "./index";
import { draftTable } from "@/database/drizzle/schema/drafts";
import { FormComponent } from "@/pages/poll/create/+Page";

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

      return c.json(c.get("userData"));
    }
  )
  .put(
    "/api/@me",
    zValidator(
      'form',
      z.object({
        username: z.string().optional(),
      }),
    ),
    async (c) => {
      const userId = getCookie(c, "voteUserId");

      if (userId) {
        const result = await c.get("db").select().from(userTable).where(eq(userTable.id, userId)).get();
        if (result) {
          const username = c.req.valid("form").username ?? null;
          await c.get("db").update(userTable).set({
            username: username
          }).where(eq(userTable.id, userId)).execute()
          
          c.set("userData", {
            ...result,
            username: username
          })

          return c.json({
            ...result,
            username: username
          });
        }
      }
      
      const id = uuid.v7();
      
      const insertResult = await c.get("db").insert(userTable).values({
        id: id,
        username: c.req.valid("form").username,
      }).returning().get();

      c.set("userData", {
        id: id,
        username: c.req.valid("form").username
      })
      setCookie(c, "voteUserId", id);

      return c.json(insertResult);
    }
  )
  .get(
    "/api/draft",
    async (c) => {
      const id = c.get("userData").id;
      if (c.get("userData").is_moderator !== true || !id) {
        throw new HTTPException(403);
      }

      const result = await c.get("db").select().from(draftTable).where(eq(draftTable.id, id)).get();
      if (result) {
        return c.json(result.data);
      } else {
        return c.json({});
      }
    }
  )
  .put(
    "/api/draft",
    zValidator(
      'json',
      z.object({
        title: z.string(),
        description: z.string(),
        author: z.string(),
        fields: z.array(
          z.object({
            type: z.string(),
            data: z.object({
              title: z.string(),
              questions: z.array(z.any()),
            })
          })
        ),
      })
    ),
    async (c) => {
      const id = c.get("userData").id;
      if (c.get("userData").is_moderator !== true || !id) {
        throw new HTTPException(403);
      }

      const data = c.req.valid("json") as FormComponent;

      const result = await c.get("db").select().from(draftTable).where(eq(draftTable.id, id)).get();
      if (result) {
        await c.get("db").update(draftTable).set({
          data: data
        }).where(eq(draftTable.id, id)).execute();
      } else {
        await c.get("db").insert(draftTable).values({
          id: id,
          data: data,
        }).execute();
      }

      return c.json("ok");
    }
  )

export default app;
export type AppType = typeof handler;
