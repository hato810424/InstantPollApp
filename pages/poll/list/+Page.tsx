import { Button, Container, Table } from "@mantine/core";
import { Data } from "./+data.shared";
import { useData } from "vike-react/useData";
import { useHydrate } from "@/utils/ssr/create-dehydrated-state";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppType } from "@/server/api";
import { hc } from "hono/client";
import { navigate } from "vike/client/router";

export default function Page() {
  const { dehydratedState } = useData<Data>();
  useHydrate(dehydratedState);

  const rpc = hc<AppType>("/");
  const { data: user } = useSuspenseQuery({
    queryKey: ['/api/@me'],
    queryFn: () =>
      rpc.api["@me"].$get().then((res) => res.json())
  })

  if (! user.is_moderator) {
    navigate("/");
  }

  const { data: polls } = useSuspenseQuery({
    queryKey: ['/api/polls'],
    queryFn: () =>
      rpc.api.polls.$get().then((res) => res.json())
  })

  const rows = polls.map((poll) => (
    <Table.Tr key={poll.poll_id}>
      <Table.Td><a href={"/polls/" + poll.poll_id}>{poll.poll.title}</a></Table.Td>
      <Table.Td>{poll.poll.description}</Table.Td>
      <Table.Td>{poll.poll.author} ({poll.author_id})</Table.Td>
      <Table.Td>{poll.answer_count}</Table.Td>
      <Table.Td><a href={"/polls/" + poll.poll_id + "/detail"}>詳細</a></Table.Td>
    </Table.Tr>
  ));

  return <>
    <Container size="md">
      <h1>Pollリスト</h1>
      <Table striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>タイトル</Table.Th>
            <Table.Th>説明</Table.Th>
            <Table.Th>作成者</Table.Th>
            <Table.Th>回答数</Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Container>
  </>;
}
