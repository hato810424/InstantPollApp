import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import vike from "vike/plugin";
import { compiled } from "vite-plugin-compiled-react";
import devServer from "@hono/vite-dev-server";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    vike({}),
    compiled({
      extract: true,
    }),
    devServer({
      entry: "./server/index.ts",

      exclude: [
        /^\/@.+$/,
        /.*\.(ts|tsx|vue)($|\?)/,
        /.*\.(s?css|less)($|\?)/,
        /^\/favicon\.ico$/,
        /.*\.(svg|png)($|\?)/,
        /^\/(public|assets|static)\/.+/,
        /^\/node_modules\/.*/,
      ],

      injectClientScript: false,
    }),
    react({}),
  ],
});
