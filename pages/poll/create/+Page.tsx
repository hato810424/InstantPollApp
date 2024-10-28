import React, { memo } from "react";
import { useData } from "vike-react/useData";
import { Data } from "./+data.shared";
import { useHydrate } from "@/utils/ssr/create-dehydrated-state";
import { hc } from "hono/client";
import { AppType } from "@/server/api";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { navigate } from 'vike/client/router'
import { Button, Container, Divider, Group, Menu, Stack, Textarea, TextInput, Tooltip } from "@mantine/core";
import { CreateRadioButton, RadioButtonProps } from "./CreateRadioButton";
import { useListState } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { nanoid } from "nanoid";
import Swal from "sweetalert2";

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
    <Container size={"md"}>
      <h1>Pollを作成</h1>
      <p>質問を作成しよう</p>
      <CreateForm initData={draftData} />
    </Container>
  );
}

export const questionComponents = {
  radio: (props: RadioButtonProps) => <CreateRadioButton {...props} />,
} as const;

export type QuestionTypes = keyof typeof questionComponents;

type ComponentProps<T> = T extends React.FC<infer P> ? P : never;
export type FormComponentData<T extends keyof typeof questionComponents> = {
  type: T;
  key: string;
  data: Parameters<ComponentProps<typeof questionComponents[T]>["setData"]>[0];
};
export type FormComponentUnionType = FormComponentData<keyof typeof questionComponents>;
export type FormComponent = {
  title: string,
  description: string,
  author: string,
  fields: FormComponentUnionType[],
}

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
  const [questions, handlers] = useListState<FormComponentUnionType>(initData.fields);
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      title: initData.title,
      description: initData.description,
      author: initData.author ?? user.username,
    },
  });

  return (
    <form onSubmit={form.onSubmit((values) => {
        const data = {
          title: values.title,
          description: values.description ?? "",
          author: values.author,
          fields: questions,
        } satisfies FormComponent;
  
        queryClient.setQueryData(["/api/draft"], () => data);
  
        rpc.api.draft.$put({
          json: data,
        }).then(() => {
          navigate("/poll/draft");
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
            />;
          })}
        </Stack>
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
        <Group justify="space-between" mt="md">
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
          <Button type="submit">プレビューへ</Button>
        </Group>
      </Stack>
    </form>
  )
});
