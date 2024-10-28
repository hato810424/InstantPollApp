import { Hono } from "hono";
import { zValidator } from '@hono/zod-validator'
import z from "zod";
import { HTTPException } from "hono/http-exception";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

import { userTable } from "../database/drizzle/schema/users";
import { and, eq } from "drizzle-orm";

import * as uuid from "uuid";

import { Variables } from "./index";
import { draftTable } from "@/database/drizzle/schema/drafts";
import { FormComponent } from "@/pages/poll/create/+Page";
import { nanoid } from "nanoid";
import { pollTable } from "@/database/drizzle/schema/polls";
import { getPoll, getPolls } from "@/database/drizzle/queries/polls";
import { FormAnswerData, FormData } from "@/pages/polls/@id/Poll";
import { answerTable } from "@/database/drizzle/schema/answers";
import { getDetail } from "@/database/drizzle/queries/answers";

const app = new Hono<{ Variables: Variables }>();

const FromComponentZod = z.object({
  title: z.string(),
  description: z.string(),
  author: z.string(),
  fields: z.array(
    z.object({
      type: z.string(),
      key: z.string(),
      data: z.object({
        title: z.string(),
        questions: z.array(z.any()),
      })
    })
  ),
});

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
      if (result && result.data !== null) {
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
      FromComponentZod,
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
  .delete(
    "/api/draft",
    async (c) => {
      const id = c.get("userData").id;
      if (c.get("userData").is_moderator !== true || !id) {
        throw new HTTPException(403);
      }
      
      await c.get("db").delete(draftTable).where(eq(draftTable.id, id)).limit(1).execute();
      return c.json("ok");
    }
  )
  .get(
    "/api/polls",
    async (c) => {
      const id = c.get("userData").id;
      if (c.get("userData").is_moderator !== true || !id) {
        throw new HTTPException(403);
      }

      const polls = await getPolls(c.get("db"));
      return c.json(polls);
    }
  )
  .post(
    "/api/polls",
    zValidator(
      'json',
      FromComponentZod,
    ),
    async (c) => {
      const id = c.get("userData").id;
      if (c.get("userData").is_moderator !== true || !id) {
        throw new HTTPException(403);
      }

      const reqData = c.req.valid("json") as FormComponent;
      const data = {
        ...reqData,
        fields: reqData.fields.map(field => {
          const key = nanoid();
          return {
            ...field,
            data: {
              ...field.data,
              key: key,
              questions: field.data.questions.map(question => ({
                ...question,
                key: nanoid(),
              }))
            }
          }
        })
      }

      // すべてのPollIdを取得
      const polls = await c.get("db").select({
        id: pollTable.id
      }).from(pollTable).all();
      
      // 被りがないまでnanoIdを生成する
      let newPollId = nanoid();
      do
        newPollId = nanoid();
      while (polls.filter(poll => poll.id === newPollId).length !== 0);

      // インサート発行
      const created = await c.get("db").insert(pollTable).values({
        id: newPollId,
        author_id: id,
        data: data,
      }).returning().get();

      return c.json(created, 201);
    }
  )
  .get(
    "/api/polls/:id",
    async (c) => {
      const pollId = c.req.param("id");
      const result = await getPoll(c.get("db"), pollId)
      if (!result) {
        throw new HTTPException(404);
      } else {
        return c.json(result);
      }
    }
  )
  .get(
    "/api/polls/:id/detail",
    async (c) => {
      const id = c.get("userData").id;
      if (c.get("userData").is_moderator !== true || !id) {
        throw new HTTPException(403);
      }
      
      const pollId = c.req.param("id");
      const result = await getDetail(c.get("db"), pollId)
      if (!result) {
        throw new HTTPException(404);
      } else {
        return c.json(result);
      }
    }
  )
  .post(
    "/api/polls/:id/answer",
    zValidator(
      'json',
      z.array(z.object({
        key: z.string(),
        value: z.any(),
      }))
    ),
    async (c) => {
      const pollId = c.req.param("id");
      const result = await getPoll(c.get("db"), pollId)
      if (!result) {
        throw new HTTPException(404);
      }

      const id = c.get("userData").id;
      if (!id) {
        throw new HTTPException(403);
      }

      const reqData = c.req.valid("json") as FormAnswerData[];

      const fields = result.data.fields.reduce((result: {
        [key: string]: {
          key: string,
          value: string[],
        }
      }, fields) => {
        result[fields.key] = {
          key: fields.key,
          value: fields.data.questions.map((question) => question.key),
        };
        return result;
      }, {});

      // 正規性チェック
      // TODO: ラジオボタン専用になってるので複数対応する場合は実装書き直し必須
      const fieldKeys = new Set(result.data.fields.map(field => field.key));
      const data: FormAnswerData[] = [];
      const usedKeys = new Set<string>();
      for (const field of reqData) {
        if (fieldKeys.has(field.key) && !usedKeys.has(field.key)) {
          if (fields[field.key].value.some(val => val === field.value)) {
            data.push(field);
            usedKeys.add(field.key);
            continue;
          } else {
            console.error("存在していない選択肢");
            throw new HTTPException(400);
          }
        } else if (usedKeys.has(field.key)) {
          throw new HTTPException(400);
        }
      }

      const answerResult = await c.get("db").select().from(answerTable).where(and(
        eq(answerTable.user_id, id),
        eq(answerTable.poll_id, result.id),
      )).get();
      if (answerResult) {
        await c.get("db").update(answerTable).set({
          data: data
        }).where(and(
          eq(answerTable.user_id, id),
          eq(answerTable.poll_id, result.id),
        )).execute();
        return c.json("上書き", 200);
      } else {
        await c.get("db").insert(answerTable).values({
          user_id: id,
          poll_id: result.id,
          data: data,
        }).execute();
        return c.json("新規", 201);
      }
    }
  )

export default app;
export type AppType = typeof handler;
