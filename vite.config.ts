import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import vike from "vike/plugin";
import devServer from "@hono/vite-dev-server";
import react from "@vitejs/plugin-react";
import { macaronVitePlugin } from '@macaron-css/vite';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    vike({}),
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
    react(),
    macaronVitePlugin(),
  ],
  ssr: {
    noExternal: [
      "@mantine/core",
      "@mantine/form",
      "@mantine/hooks",
      "@mantine/charts",
    ]
  }
});
