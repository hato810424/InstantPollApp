import { css } from "@compiled/react";
import { md5 } from "js-md5";
import { Button, Container, Fieldset, Group, Radio, Stack } from "@mantine/core";
import { Data } from "./+data.shared";
import { useData } from "vike-react/useData";
import { useHydrate } from "@/utils/ssr/create-dehydrated-state";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppType } from "@/server/api";
import { hc } from "hono/client";
import { navigate } from "vike/client/router";
import { FormComponent } from "../create/+Page";

const h1 = css({
  fontWeight: "normal",
});

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

  const { data: draft } = useSuspenseQuery<FormComponent>({
    queryKey: ['/api/draft'],
  })

  return (
    <Container size="md">
      <small>{draft.author}によって作成された質問です</small>
      <h1 css={h1}>「{draft.title}」のプレビュー</h1>
      <p style={{ 
        whiteSpace: "pre-wrap",
      }}>{draft.description}</p>
      <Stack>
        <Stack>
          {draft.fields.map((question, index) => (
            <Fieldset key={index}>
              <Radio.Group
                name={md5(JSON.stringify(question.data))}
                label={question.data.title}
                withAsterisk
              >
                <Stack mt="xs">
                  {question.data.questions.map((button, index) => (
                    <Radio key={index} value={button.label} label={button.label} />
                  ))}
                </Stack>
              </Radio.Group>
            </Fieldset>
          ))}
        </Stack>
        <Group justify="space-between">
          <Button onClick={() => {
            navigate("/poll/create")
          }}>戻る</Button>
          <Button color="red" onClick={() => {
            const result = confirm("公開しますか？");
            if (result) {
              console.log("test");
            }
          }}>公開</Button>
        </Group>
      </Stack>
    </Container>
  )
}
