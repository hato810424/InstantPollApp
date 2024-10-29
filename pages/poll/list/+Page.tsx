import { ActionIcon, Button, Center, Container, Table, Text, Tooltip } from "@mantine/core";
import { Data } from "./+data.shared";
import { useData } from "vike-react/useData";
import { useHydrate } from "@/utils/ssr/create-dehydrated-state";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppType } from "@/server/api";
import { hc } from "hono/client";
import { navigate } from "vike/client/router";
import { QRCodeSVG } from 'qrcode.react';
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { style } from "@macaron-css/core";
import { QrCode } from "lucide-react";

const QRCodeToast = ({
  url
}: {
  url: URL
}) => {
  return (
    <div>
      <QRCodeSVG
        value={url.toString()}
        size={256}
        style={{
          maxWidth: "95%",
          maxHeight: "70%",
        }}
      />
      <p className={style({
        fontSize: "1.3rem",
      })}>{url.toString()}</p>
    </div>
  )
}

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
      <Table.Td>
        <a href={"/polls/" + poll.poll_id}>{poll.poll.title}</a><br/>
        <small>{poll.poll.description}</small>
      </Table.Td>
      <Table.Td>
        {poll.poll.author}<br/>
        <small>({poll.author_id})</small>
      </Table.Td>
      <Table.Td>{poll.answer_count}</Table.Td>
      <Table.Td><a href={"/polls/" + poll.poll_id + "/detail"}>詳細</a></Table.Td>
      <Table.Td>
        <Tooltip label="QRコードを表示" openDelay={0}>
          <ActionIcon size={"lg"} variant="filled" aria-label="QR Codeを表示" onClick={() => {
            const url = new URL("/polls/" + poll.poll_id, location.origin);

            withReactContent(Swal).fire({
              title: <>「{poll.poll.title}」へのリンク</>,
              html: <QRCodeToast url={url} />,
              width: "70%",
              confirmButtonText: "閉じる",
            });
          }}>
            <QrCode size={28} strokeWidth={1.75} />
          </ActionIcon>
        </Tooltip>
      </Table.Td>
    </Table.Tr>
  ));

  return <>
    <Container size="md">
      <h1>Pollリスト</h1>
      <Table striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th></Table.Th>
            <Table.Th>作成者</Table.Th>
            <Table.Th>回答数</Table.Th>
            <Table.Th></Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Container>
  </>;
}
