import { memo, useState } from "react";
import { useData } from "vike-react/useData";
import { Data } from "./+data.shared";
import { useHydrate } from "@/utils/ssr/create-dehydrated-state";
import { hc } from "hono/client";
import { AppType } from "@/server/api";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { navigate } from 'vike/client/router'
import { Button, Center, Container, Divider, Group, Menu, Stack, Textarea, TextInput, Tooltip } from "@mantine/core";
import { CreateRadioButton, RadioButtonProps } from "./CreateRadioButton";
import { useListState } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { nanoid } from "nanoid";
import Swal from "sweetalert2";
import { omit } from "es-toolkit";

export default function Page() {
  const { dehydratedState } = useData<Data>();
  useHydrate(dehydratedState);

  const rpc = hc<AppType>("/");

  const { data: user } = useSuspenseQuery({
    queryKey: ['/api/@me'],
    queryFn: () =>
      rpc.api["@me"].$get().then((res) => res.json())
  })

  if (!user.is_moderator) {
    navigate("/");
  }

  const { data: draft } = useSuspenseQuery<FormComponent | {}>({
    queryKey: ['/api/draft'],
    queryFn: () =>
      rpc.api.draft.$get().then((res) => res.json())
  })

  const draftData: FormComponent = {
    title: "",
    description: "",
    author: "",
    fields: [],
    ...draft,
  }

  return (
    <Container size={"sm"} p={0}>
      <h1>Pollを作成</h1>
      <p>質問を作成しよう</p>
      <CreateForm initData={draftData} />
    </Container>
  );
}

const questionComponents = {
  radio: (props: RadioButtonProps) => <CreateRadioButton {...props} />,
} as const;
export type QuestionTypes = keyof typeof questionComponents;

type ComponentProps<T> = T extends React.FC<infer P> ? P : never;
export type FormComponentData<T extends QuestionTypes> = {
  type: T;
  key: string;
  data: Parameters<ComponentProps<typeof questionComponents[T]>["setData"]>[0];
};
export type FormComponentUnionType = FormComponentData<QuestionTypes>;
export type FormComponent = {
  title: string,
  description: string,
  author: string,
  fields: FormComponentUnionType[],
}

const questionsCheck = {
  radio: (data) => {
    if (data.data.questions.length == 0) {
      return {
        error: "選択肢を最低1個追加してください"
      };
    }

    return {};
  }
} as const satisfies {
  [K in QuestionTypes]: (data: FormComponentData<K>) => {
    error?: string,
  };
};

const CreateForm = memo(({
  initData
}: {
  initData: FormComponent,
}) => {
  const rpc = hc<AppType>("/");
  
  const { data: user } = useSuspenseQuery({
    queryKey: ['/api/@me'],
    queryFn: () => {
      return rpc.api["@me"].$get().then((res) => res.json())
    }
  })

  const queryClient = useQueryClient();
  const [putting, setPutting] = useState(false);
  const [questions, handlers] = useListState<FormComponentUnionType & {
    error?: string,
  }>(initData.fields);
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      title: initData.title,
      description: initData.description,
      author: initData.author ?? user.username,
    },
  });

  return (
    <form 
      onSubmit={form.onSubmit((values) => {
        if (questions.length === 0) return;

        let isError = false;
        questions.forEach((question, index) => {
          let result: {
            error?: string
          } = {};

          if (question.type === "radio") {
            result = questionsCheck.radio(question);
          }

          if (result.error) {
            isError = true;
            handlers.setItem(index, {
              ...question,
              error: result.error,
            });
          } else {
            if (question.error) {
              handlers.setItem(index, omit(question, ["error"]));
            }
          }
        })
        if (isError) return;
        
        const data = {
          title: values.title,
          description: values.description ?? "",
          author: values.author,
          fields: questions.map(question => omit(question, ["error"])),
        } satisfies FormComponent;
  
        setPutting(true);
        rpc.api.draft.$put({
          json: data,
        }).then(async () => {
          queryClient.setQueryData(["/api/draft"], () => data);
          await navigate("/poll/draft");
          setPutting(false);
        })
      })}
    >
      <Stack>
        <Stack>
          <TextInput label={"タイトル"} key={form.key("title")} required {...form.getInputProps("title")} />
          <Textarea label={"説明・概要"} placeholder="(任意入力)" key={form.key("description")} {...form.getInputProps("description")} />
          <TextInput label={"作成者名"} key={form.key("author")} required {...form.getInputProps("author")} />
        </Stack>
        <Divider my="md" />
        <Stack>
          {questions.map((question, index) => {
            // コンポーネント名に対応する関数を取得
            const Component = questionComponents[question.type];
            if (!Component) {
              // 対応するコンポーネントがない場合、nullを返す（もしくはエラーメッセージ）
              return <div key={index}>Unknown Component: {question.type}</div>;
            }

            // コンポーネントをレンダリングし、指定したpropsを渡す
            return <Component
              key={question.key}
              initialValues={question.data}
              setData={(data) => {
                handlers.setItem(index, {
                  ...question,
                  data: data,
                })
              }}
              remove={() => {
                handlers.remove(index);
              }}
              error={question.error}
            />;
          })}
        </Stack>
        <Center>
          <Menu shadow="md" width={200} menuItemTabIndex={0}>
            <Menu.Target>
              <Button>質問を追加</Button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>ボタン</Menu.Label>
              <Tooltip label="1つしか選択できないボタン" openDelay={0} closeDelay={0}>
                <Menu.Item onClick={() => {
                  handlers.insert(questions.length, {
                    type: "radio",
                    key: nanoid(),
                    data: {
                      title: "",
                      questions: [],
                    }
                  })
                }}>
                  ラジオボタン
                </Menu.Item>
              </Tooltip>
              {/* <Tooltip label="複数選択できるボタン" openDelay={0} closeDelay={0}>
                <Menu.Item>
                  チェックボックス
                </Menu.Item>
              </Tooltip>

              <Menu.Divider />

              <Menu.Label>テキスト・入力欄</Menu.Label>
              <Tooltip label="1行テキスト" openDelay={0} closeDelay={0}>
                <Menu.Item>
                  テキスト
                </Menu.Item>
              </Tooltip>
              <Tooltip label="複数行テキスト" openDelay={0} closeDelay={0}>
                <Menu.Item>
                  テキスト（複数行）
                </Menu.Item>
              </Tooltip>
              <Tooltip label="数字" openDelay={0} closeDelay={0}>
                <Menu.Item>
                  ナンバー
                </Menu.Item>
              </Tooltip> */}
            </Menu.Dropdown>
          </Menu>
        </Center>
        <Group justify="space-between" mt="md" pt={"lg"} pb={"lg"}>
          <Button onClick={() => {
            Swal.fire({
              title: "本当に下書きを削除しますか？",
              icon: "question",
              showCancelButton: true,
              focusCancel: true,
              cancelButtonText: "キャンセル",
              confirmButtonColor: "#fa5252",
              confirmButtonText: "削除する",
            }).then(val => {
              if (val.isConfirmed) {
                rpc.api.draft.$delete().then(res => {
                  queryClient.setQueryData(["/api/draft"], () => ({}));
                  navigate("/");
                });
              }
            })
          }} color="red">下書きを削除</Button>
          {questions.length === 0 ? (
            <Button loading={putting} disabled aria-label="質問を最低1つ追加してください">プレビューへ</Button>
          ) : (
            <Button type="submit" loading={putting}>プレビューへ</Button>
          )}
        </Group>
      </Stack>
    </form>
  )
});
