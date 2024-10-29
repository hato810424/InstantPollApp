import type { AppType } from "../../server/api.js";
import { hc } from 'hono/client';
import { useData } from "vike-react/useData";
import { Data } from "./+data.shared.js";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useHydrate } from "../../utils/ssr/create-dehydrated-state.js";
import { NameChange } from "../polls/@id/+Page.jsx";
import { Container, Stack } from "@mantine/core";
import { normalWeight } from "@/utils/styles.js";

export default function Page() {
  const { dehydratedState } = useData<Data>();
  useHydrate(dehydratedState);

  const rpc = hc<AppType>("/");

  const { data: user } = useSuspenseQuery({
    queryKey: ['/api/@me'],
    queryFn: () =>
      rpc.api["@me"].$get().then((res) => res.json())
  })

  return (
    <Container size={"xs"} mt={"lg"} p={"md"}>
      <h1 className={normalWeight}>ホーム画面</h1>
      <NameChange next={() => {}} />
        
      <Stack>
        <small>（UID: {user.id}）</small>
      </Stack>
      {user.is_moderator && (
        <Stack>
          <h2>管理画面</h2>
          <li><a href="/poll/create">Pollを作成</a></li>
          <li><a href="/poll/list">Pollを確認</a></li>
        </Stack>
      )}
    </Container>
  );
}
