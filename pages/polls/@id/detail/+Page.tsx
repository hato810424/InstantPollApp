import { AppType } from "@/server/api";
import { useHydrate } from "@/utils/ssr/create-dehydrated-state";
import { Accordion, Button, Container, Divider, Group, Stack } from "@mantine/core";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { hc, InferResponseType } from "hono/client";
import { useData } from "vike-react/useData";
import { navigate } from "vike/client/router";
import { Data } from "../+data.shared";
import { usePageContext } from "vike-react/usePageContext";
import { QuestionTypes } from "@/pages/poll/create/+Page";
import { RadioButtonResult, RadioButtonResultProps } from "./ResultComponents";
import { render } from "vike/abort";
import Swal from "sweetalert2";

const resultQuestionComponents = {
  radio: (props: RadioButtonResultProps) => <RadioButtonResult {...props} />,
} as const satisfies {
  [K in QuestionTypes]: any
};

export default function Page() {
  const { routeParams } = usePageContext();
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

  const pollId = routeParams.id;
  const $poll = rpc.api.polls[":id"].$get;
  const { data: poll } = useSuspenseQuery({
    queryKey: ['/api/polls/' + pollId],
    queryFn: () => rpc.api.polls[":id"].$get({
      param: {
        id: pollId,
      }
    }).then((res) => res.json()),
  });

  const { data: pollDetail } = useSuspenseQuery({
    queryKey: ['/api/polls/' + pollId + '/detail'],
    queryFn: () => rpc.api.polls[":id"].detail.$get({
      param: {
        id: pollId,
      }
    }).then((res) => res.json()),
  });

  if (!poll.id) {
    render("/polls/notfound");
    return;
  }

  const Answers = () => {
    return (
      <Stack gap={"xl"}>
        {poll.data.fields.map((question, index) => {
          // コンポーネント名に対応する関数を取得
          const Component = resultQuestionComponents[question.type];
          if (!Component) {
            // 対応するコンポーネントがない場合、nullを返す（もしくはエラーメッセージ）
            return <div key={index}>Unknown Component: {question.type}</div>;
          }
          // コンポーネントをレンダリングし、指定したpropsを渡す
          return <Component
            key={index}
            content={question}
            users={pollDetail.users}
            answers={pollDetail.answers[question.key] ?? undefined}
          />;
        })}
      </Stack>
    )
  }

  return (
    <Container size="md">
      <Stack>
        <div>
          <h1>「{poll.data.title}」の詳細</h1>
          <p>
            説明文「{poll.data.description}」<br/>
            作成者「{poll.data.author} ({poll.author_id})」<br/>
          </p>
        </div>
        <Group>
          {!poll.is_ended ? (
            <Button onClick={() => {
              Swal.fire({
                title: "回答を受け付けなくしますか？",
                icon: "question",
                showCancelButton: true,
                focusCancel: true,
                cancelButtonText: "キャンセル",
                confirmButtonColor: "#228be6",
                confirmButtonText: "締め切る",
              }).then(async (val) => {
                if (val.isConfirmed) {
                  const res = await rpc.api.polls[":id"].close.$post({
                    param: {
                      id: poll.id,
                    }
                  });
      
                  if (res.ok) {
                    queryClient.invalidateQueries({
                      queryKey: ['/api/polls/' + pollId + '/detail']
                    });

                    const resData = await res.json();
                    queryClient.setQueryData<InferResponseType<typeof $poll>>(['/api/polls/' + pollId], (data) => {
                      if (data) {
                        return {
                          ...data,
                          closed_at: resData.closed_at,
                          is_ended: resData.is_ended,
                        }
                      } else {
                        return data;
                      }
                    })
                  } else {
                    Swal.fire({
                      title: "締め切り処理中に何かエラーが発生しました...",
                      text: `${res.status} - ${res.statusText}`,
                      icon: "error"
                    })
                  }
                }
              })
            }}>回答を締め切る</Button>
          ) : (
            <Button>回答を締め切りました</Button>
          )}
        </Group>
        <Divider my="md" />
        {poll.is_ended ? (
          <Answers />
        ) : (
          <Accordion chevronPosition="right" variant="contained" transitionDuration={0}>
            <Accordion.Item value={"answers"}>
              <Accordion.Control>
                途中経過を見る
              </Accordion.Control>
              <Accordion.Panel>
                <Answers />
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        )}
      </Stack>
    </Container>
  )
}
