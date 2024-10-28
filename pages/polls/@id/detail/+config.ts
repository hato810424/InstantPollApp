import type { Config } from "vike/types";
import LayoutAdmin from "@/layouts/LayoutAdmin";

// Default config (can be overridden by pages)
// https://vike.dev/config

export default {
  // https://vike.dev/Layout
  Layout: LayoutAdmin,
} satisfies Config;
