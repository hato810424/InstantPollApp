import { Button, Container, Group, Space } from "@mantine/core";
import { Data } from "./+data.shared";
import { useData } from "vike-react/useData";
import { useHydrate } from "@/utils/ssr/create-dehydrated-state";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { AppType } from "@/server/api";
import { hc } from "hono/client";
import { navigate } from "vike/client/router";
import { Poll } from "@/pages/polls/@id/Poll";
import { PollItem } from "@/database/drizzle/schema/polls";
import { nanoid } from "nanoid";
import Swal from "sweetalert2";

export default function Page() {
  const { dehydratedState } = useData<Data>();
  useHydrate(dehydratedState);

  const queryClient = useQueryClient();
  const rpc = hc<AppType>("/");
  const { data: user } = useSuspenseQuery({
    queryKey: ['/api/@me'],
    queryFn: () =>
      rpc.api["@me"].$get().then((res) => res.json())
  })

  if (! user.is_moderator) {
    navigate("/");
  }

  const { data: draft } = useSuspenseQuery({
    queryKey: ['/api/draft'],
    queryFn: () =>
      rpc.api.draft.$get().then((res) => res.json())
  })

  const poll = {
    id: nanoid(),
    author_id: user.id ?? "",
    data: draft,
    created_at: Date.now(),
    closed_at: null,
  } satisfies PollItem

  return <>
    <Poll preview={true} poll={poll} />
    <Space h="md" />
    <Container size="md">
      <Group justify="space-between">
        <Button onClick={() => {
          navigate("/poll/create")
        }}>戻る</Button>
        <Button color="green" onClick={async () => {
          Swal.fire({
            title: "公開しますか？",
            icon: "question",
            showCancelButton: true,
            focusCancel: true,
            cancelButtonText: "キャンセル",
            confirmButtonColor: "#40c057",
            confirmButtonText: "公開する",
          }).then(async (val) => {
            if (val.isConfirmed) {
              const res = await rpc.api.polls.$post({
                json: draft
              });
  
              if (res.ok) {
                const data = await res.json();
                queryClient.invalidateQueries({
                  queryKey: ['/api/polls'],
                });
                navigate("/poll/list");
              }
            }
          })
        }}>公開</Button>
      </Group>
    </Container>
  </>;
}
