// https://vike.dev/data
import type { PageContextServer } from "vike/types";
import { createDehydratedState } from "../../../utils/ssr/create-dehydrated-state";

export type Data = Awaited<ReturnType<typeof data>>;

export default async function data(_pageContext: PageContextServer) {
  const user = _pageContext.userData;
  if (typeof window !== "undefined") {
    return {};
  }

  const dehydratedState = await createDehydratedState([
    {
      queryKey: ["/api/@me"],
      queryFn: async () => user,
    },
  ]);

  return {
    dehydratedState,
  };
}
