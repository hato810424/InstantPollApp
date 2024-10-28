// https://vike.dev/data
import type { PageContextServer } from "vike/types";
import { createDehydratedState } from "../../../utils/ssr/create-dehydrated-state";
import { pollTable } from "@/database/drizzle/schema/polls";
import { eq } from "drizzle-orm";

export type Data = Awaited<ReturnType<typeof data>>;

export default async function data(_pageContext: PageContextServer) {
  const user = _pageContext.userData;
  if (typeof window !== "undefined") {
    return {};
  }

  const poll_id = _pageContext.routeParams.id;
  const result = await _pageContext.db.select().from(pollTable).where(eq(pollTable.id, poll_id)).get();
  const poll_data = result ? result : null;

  const dehydratedState = await createDehydratedState([
    {
      queryKey: ["/api/@me"],
      queryFn: async () => user,
    },
    {
      queryKey: ["/api/polls/" + poll_id],
      queryFn: async () => poll_data,
    }
  ]);

  return {
    dehydratedState,
  };
}
