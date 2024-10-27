// https://vike.dev/data
import type { PageContextServer } from "vike/types";
import { createDehydratedState } from "@/utils/ssr/create-dehydrated-state";
import { draftTable } from "@/database/drizzle/schema/drafts";
import { eq } from "drizzle-orm";

export type Data = Awaited<ReturnType<typeof data>>;

export default async function data(_pageContext: PageContextServer) {
  const user = _pageContext.userData;
  if (typeof window !== "undefined" || !user.id) {
    return {};
  }

  const result = await _pageContext.db.select().from(draftTable).where(eq(draftTable.id, user.id)).get();
  const draft_data = (!result || result.data === null) ? [] : result.data;

  const dehydratedState = await createDehydratedState([
    {
      queryKey: ["/api/@me"],
      queryFn: async () => user,
    },
    {
      queryKey: ["/api/draft"],
      queryFn: async () => draft_data
    }
  ]);

  return {
    dehydratedState,
  };
}
