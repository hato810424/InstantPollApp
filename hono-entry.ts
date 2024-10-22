import "dotenv/config";

import { createTodoHandler } from "./server/create-todo-handler";
import { vikeHandler } from "./server/vike-handler";
import { Hono } from "hono";
import { createHandler, createMiddleware } from "@universal-middleware/hono";
import { dbMiddleware } from "./server/db-middleware";
import { poweredBy } from "hono/powered-by";

import apiRoute from "./hono-api";

const app = new Hono();

app.use(poweredBy());
app.use(createMiddleware(dbMiddleware)());

app.route("/", apiRoute);

app.post("/api/todo/create", createHandler(createTodoHandler)());

/**
 * Vike route
 *
 * @link {@see https://vike.dev}
 **/
app.all("*", createHandler(vikeHandler)());

export default app;
