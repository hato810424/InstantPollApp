import { serve } from "@hono/node-server";
import { type Context, Hono } from "hono";
import { env } from "hono/adapter";
import { compress } from "hono/compress";
import app from "./index";

const envs = env<{ NODE_ENV: string; PORT: string }>({ env: {} } as unknown as Context<object>);

const nodeApp = new Hono();

nodeApp.use(compress());
nodeApp.route("/", app!);

const port = envs.PORT ? parseInt(envs.PORT, 10) : 3000;
serve({
  fetch: nodeApp.fetch,
  port: port,
}).on("listening", () => console.log(`Server listening on http://localhost:${port}`));
