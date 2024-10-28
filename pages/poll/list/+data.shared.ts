// https://vike.dev/data
import type { PageContextServer } from "vike/types";
import { createDehydratedState } from "@/utils/ssr/create-dehydrated-state";
import { getPolls } from "@/database/drizzle/queries/polls";

export type Data = Awaited<ReturnType<typeof data>>;

export default async function data(_pageContext: PageContextServer) {
  const user = _pageContext.userData;
  if (typeof window !== "undefined" || !user.id) {
    return {};
  }

  const polls = await getPolls(_pageContext.db);

  const dehydratedState = await createDehydratedState([
    {
      queryKey: ["/api/@me"],
      queryFn: async () => user,
    },
    {
      queryKey: ["/api/polls"],
      queryFn: async () => polls
    }
  ]);

  return {
    dehydratedState,
  };
}
