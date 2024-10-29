import React, { useState } from "react";
import { useData } from "vike-react/useData";
import { Data } from "./+data.shared";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useHydrate } from "../../../utils/ssr/create-dehydrated-state";
import { hc, InferResponseType } from "hono/client";
import { AppType } from "../../../server/api";
import { Accordion, Alert, Center, Checkbox, Container, Divider, Fieldset, Stack, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { Button, Group, TextInput } from "@mantine/core";
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { usePageContext } from "vike-react/usePageContext";
import { Poll } from "./Poll";
import { navigate } from "vike/client/router";
import { normalWeight } from "@/utils/styles";

export default function Page() {
  const { routeParams } = usePageContext();
  const { dehydratedState } = useData<Data>();
  useHydrate(dehydratedState);

  const rpc = hc<AppType>("/");

  const { data: user } = useSuspenseQuery({
    queryKey: ['/api/@me'],
    queryFn: () =>
      rpc.api["@me"].$get().then((res) => res.json())
  })

  const pollId = routeParams.id;
  const { data: poll } = useSuspenseQuery({
    queryKey: ['/api/polls/' + pollId],
    queryFn: () => rpc.api.polls[":id"].$get({
      param: {
        id: pollId,
      }
    }).then((res) => res.json()),
  });

  if (!poll.id) {
    navigate("/polls/notfound");
    return;
  }

  const [page, setPage] = useState<"initial" | "poll" | "success" | "closed">(poll.is_ended ? "closed" : "initial");
  if (page === "closed") {
    return <>
      <Container size="md">
        <Stack>
          <div>
            <h1 className={normalWeight}>「{poll.data.title}」への回答の受け付けは終了しました</h1>
          </div>
          <Fieldset legend="アーカイブ">
            <Poll poll={poll} preview={true} disabled={true} />
          </Fieldset>
        </Stack>
      </Container>
    </>
  } if (page === "initial") {
    return <InitialScreen next={() => setPage("poll")} />;
  } if (page === "poll") {
    return <>
      <Container size="sm" p={0}>
        <Center>
          <Group pt={"lg"} pb={"lg"}>
            {user.username === null ? (
              <Alert variant="light" color="gray" title="匿名で回答中です">
                <Button size="xs" onClick={() => setPage("initial")}>やっぱり名前を変更する</Button>
              </Alert>
            ) : (
              <Alert variant="light" color="gray" title={"「" + user.username + "」として回答中です"}>
                <Button size="xs" onClick={() => setPage("initial")}>やっぱり名前を変更する</Button>
              </Alert>
            )}
          </Group>
        </Center>
      </Container>
      <Poll poll={poll} success={() => setPage("success")} />
    </>;
  } if (page === "success") {
    return <>
      <Container size="sm" p={"sm"}>
        <h1 className={normalWeight}>回答済み！</h1>
        <p>
          「{poll.data.title}」へご回答ありがとうございました！
        </p>
        <Group justify="flex-end" mt="md">
          <Button onClick={() => setPage("poll")}>回答を変更したい</Button>
        </Group>
      </Container>
    </>;
  }
}

const InitialScreen = ({
  next
}: {
  next: () => void;
}) => {
  return (
    <Container size={"xs"} mt={"lg"} p={"md"}>
      <h1 className={normalWeight}>答える前に..</h1>
      <p>あなたの名前を伝えませんか？</p>
      <NameChange next={next} />
    </Container>
  );
}

export const NameChange = ({
  next
}: {
  next: () => void;
}) => {
  const queryClient = useQueryClient();
  const rpc = hc<AppType>("/");
  const meGet = rpc.api["@me"].$get;

  const [parent] = useAutoAnimate({
    duration: 200,
  })

  const { data: user } = useSuspenseQuery({
    queryKey: ['/api/@me'],
    queryFn: () =>
      rpc.api["@me"].$get().then((res) => res.json())
  })

  const [putting, setPutting] = useState(false);
  const signature = user.username && (user.username !== null);
  const form = useForm({
    mode: "controlled",
    initialValues: {
      name: user.username ?? "",
      signature: signature,
    },

    validate: (values) => ({
      name: (values.signature && values.name.replace(/[\pu{Zs}\s]+/g, "").length == 0 && "その名前にはできません") ?? null,
    }),
  });

  return (
    <form ref={parent} onSubmit={form.onSubmit(async (values) => {
      if (values.signature && values.name !== user.username) {
        // 名前を設定する
        setPutting(true);
        await rpc.api["@me"].$put({
          form: {
            username: values.name,
          }
        }).then(async (res) => {
          const resJson = await res.json();
            queryClient.setQueryData<InferResponseType<typeof meGet>>(["/api/@me"], (data) => ({
              ...data,
              ...resJson,
            }));
          next();
        }).finally(() => setPutting(false))
      } else {
        // 匿名ユーザーの名前をnullにする
        if (user.username === undefined || (!values.signature && user.username !== null)) {
          setPutting(true);
          await rpc.api["@me"].$put({
            form: {}
          }).then(async (res) => {
            const resJson = await res.json();
            queryClient.setQueryData<InferResponseType<typeof meGet>>(["/api/@me"], (data) => ({
              ...data,
              ...resJson,
            }));
            next();
          }).finally(() => setPutting(false))
        } else {
          next();
        }
      }
    })}>
      <Checkbox
        mt="md"
        label={user.username == null ? "名前をつたえる" : "名前をつたえる （以前設定した名前があります）"}
        key={form.key('signature')}
        {...form.getInputProps('signature', { type: 'checkbox' })}
      />
      {form.getValues().signature && (
        <TextInput
          mt={"md"}
          withAsterisk
          autoFocus
          label="あなたの名前"
          key={form.key('name')}
          {...form.getInputProps('name')}
        />
      )}

      <Group justify="flex-end" mt="md">
        <Button loading={putting} disabled={putting} type="submit">{form.getValues().signature ? "名前で答える" : "匿名で答える"}</Button>
      </Group>
    </form>
  );
}
