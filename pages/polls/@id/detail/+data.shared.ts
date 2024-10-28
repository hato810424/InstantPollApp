// https://vike.dev/data
import type { PageContextServer } from "vike/types";
import { getPoll } from "@/database/drizzle/queries/polls";
import { redirect, render } from "vike/abort";
import { createDehydratedState } from "@/utils/ssr/create-dehydrated-state";
import { getAnswers, getDetail } from "@/database/drizzle/queries/answers";

export type Data = Awaited<ReturnType<typeof data>>;

export default async function data(_pageContext: PageContextServer) {
  const user = _pageContext.userData;
  if (typeof window !== "undefined") {
    return {};
  }

  const poll_id = _pageContext.routeParams.id;
  const poll_result = await getPoll(_pageContext.db, poll_id);
  const poll_data = poll_result ? poll_result : {};

  const answers_result = await getDetail(_pageContext.db, poll_id);
  const answers_data = answers_result ? answers_result : {};

  if (!poll_result) {
    throw render("/polls/notfound");
  }

  const dehydratedState = await createDehydratedState([
    {
      queryKey: ["/api/@me"],
      queryFn: async () => user,
    },
    {
      queryKey: ["/api/polls/" + poll_id],
      queryFn: async () => poll_data,
    },
    {
      queryKey: ["/api/polls/" + poll_id + "/detail"],
      queryFn: async () => answers_data,
    }
  ]);

  return {
    dehydratedState,
  };
}
