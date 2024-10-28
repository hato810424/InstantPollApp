import { AppType } from "@/server/api";
import { useHydrate } from "@/utils/ssr/create-dehydrated-state";
import { Container, Stack } from "@mantine/core";
import { useSuspenseQuery } from "@tanstack/react-query";
import { hc } from "hono/client";
import { useData } from "vike-react/useData";
import { navigate } from "vike/client/router";
import { Data } from "../+data.shared";
import { usePageContext } from "vike-react/usePageContext";
import { transformFields } from "../Poll";
import { useCallback, useMemo } from "react";
import { QuestionTypes } from "@/pages/poll/create/+Page";
import { RadioButtonResult, RadioButtonResultProps } from "./ResultComponents";
import { render } from "vike/abort";

const resultQuestionComponents = {
  radio: (props: RadioButtonResultProps) => <RadioButtonResult {...props} />,
} as const satisfies {
  [K in QuestionTypes]: any
};

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

  if (! user.is_moderator) {
    navigate("/");
  }

  const pollId = routeParams.id;
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

  return (
    <Container size="md">
      <h1>「{poll.data.title}」の詳細</h1>
      <p>
        説明文「{poll.data.description}」<br/>
        作成者「{poll.data.author} ({poll.author_id})」<br/>
      </p>
      <Stack>
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
            answers={pollDetail.answers[question.key]}
          />;
        })}
      </Stack>
    </Container>
  )
}
