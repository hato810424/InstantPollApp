// https://vike.dev/data
import type { PageContextServer } from "vike/types";

import { UserItem } from "../../database/drizzle/schema/users";

export type Data = {
  user: UserItem | undefined;
};

export default async function data(_pageContext: PageContextServer): Promise<Data> {
  const user = _pageContext.userData;

  return { user };
}
