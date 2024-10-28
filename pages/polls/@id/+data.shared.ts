// https://vike.dev/data
import type { PageContextServer } from "vike/types";
import { createDehydratedState } from "../../../utils/ssr/create-dehydrated-state";
import { getPoll } from "@/database/drizzle/queries/polls";
import { redirect } from "vike/abort";

export type Data = Awaited<ReturnType<typeof data>>;

export default async function data(_pageContext: PageContextServer) {
  const user = _pageContext.userData;
  if (typeof window !== "undefined") {
    return {};
  }

  const poll_id = _pageContext.routeParams.id;
  const result = await getPoll(_pageContext.db, poll_id);
  const poll_data = result ? result : {};

  if (!result) {
    throw redirect("/polls/notfound");
  }

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
