import vikeReact from "vike-react/config";
import vikeReactQuery from 'vike-react-query/config'

import type { Config } from "vike/types";
import Layout from "../layouts/LayoutDefault.js";

// Default config (can be overridden by pages)
// https://vike.dev/config

export default {
  // https://vike.dev/Layout
  Layout,

  // https://vike.dev/head-tags
  title: "インスタントアンケートアプリ",
  description: "即席でアンケート・投票を行えるアプリです。",

  extends: [vikeReact, vikeReactQuery],

  queryClientConfig: {
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: true,
        gcTime: Infinity,
        staleTime: 1000 * 60 * 5, // 5分キャッシュ
      }
    }
  }
} satisfies Config;
