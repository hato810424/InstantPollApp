import { Button, Container, Group, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useCallback } from "react";
import { PollItem } from "@/database/drizzle/schema/polls";
import { PollRadioButton, PollRadioButtonData, PollRadioButtonProps } from "./PollComponents";
import { FormComponentUnionType, QuestionTypes } from "@/pages/poll/create/+Page";
import { hc } from "hono/client";
import { AppType } from "@/server/api";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { normalWeight } from "@/utils/styles";

export type FormAnswerData = PollRadioButtonData;
export type FormData = {
  [key: string]: FormAnswerData
};

export const transformFields = (fields: FormComponentUnionType[]) => fields.reduce((result: FormData, fields) => {
  result[fields.key] = {
    key: fields.key,
    value: undefined,
  };
  return result;
}, {});

const questionComponents = {
  radio: (props: PollRadioButtonProps) => <PollRadioButton {...props} />,
} as const satisfies {
  [K in QuestionTypes]: any
};

export const Poll = ({
  poll,
  preview = false,
  disabled = false,
  success = () => {},
}: {
  poll: PollItem,
  preview?: boolean,
  disabled?: boolean,
  success?: () => void,
}) => {
  const rpc = hc<AppType>("/");
  const fields = useCallback(transformFields, [poll])(poll.data.fields);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: fields,
  });

  return (
    <Container size={"sm"} p={"sm"}>
      <small>「{poll.data.author}」によって作成された質問です</small>
      {preview ? (
        <h1 className={normalWeight}>「{poll.data.title}」のプレビュー</h1>
      ) : (
        <h1 className={normalWeight}>「{poll.data.title}」</h1>
      )}
      <p style={{ 
        whiteSpace: "pre-wrap",
      }}>{poll.data.description}</p>
      <form onSubmit={form.onSubmit(values => {
        const data = Object.values(values);
        let isError = false;

        data.forEach(value => {
          if (!(value.value)) {
            form.setErrors((errors) => ({
              ...errors,
              [value.key]: "入力してください"
            }));
            isError = true;
          } else {
            form.clearFieldError(value.key);
          }
        })

        if (isError) return;
        rpc.api.polls[":id"].answer.$post({
          param: {
            id: poll.id,
          },
          json: data,
        }).then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            success();

            if (data.isFirst) {
              Swal.fire({
                title: "回答が完了しました！",
                icon: "success"
              });
            } else {
              Swal.fire({
                title: "回答を変更しました！",
                icon: "success"
              });
            }
          } else {
            const text = await res.text();
            withReactContent(Swal).fire({
              title: "送信中に何かエラーが発生しました...",
              html: (
                <div>
                  <p>{res.status} - {res.statusText}</p>
                  <p style={{ 
                    whiteSpace: "pre-wrap",
                  }}>{text}</p>
                </div>
              ),
              confirmButtonText: "閉じる",
              icon: "error",
            });
          }
        })
      })}>
        <Stack>
          <Stack>
            {poll.data.fields.map((question, index) => {
              // コンポーネント名に対応する関数を取得
              const Component = questionComponents[question.type];
              if (!Component) {
                // 対応するコンポーネントがない場合、nullを返す（もしくはエラーメッセージ）
                return <div key={index}>Unknown Component: {question.type}</div>;
              }

              // コンポーネントをレンダリングし、指定したpropsを渡す
              return <Component
                key={index}
                componentData={question}
                data={form.getValues()[question.key]}
                disabled={disabled}
                setData={(data) => {
                  form.setValues((values) => ({
                    ...values,
                    [data.key]: data,
                  }))
                }}
                error={form.errors[question.key]}
              />;
            })}
          </Stack>
          {!preview && <Group justify="flex-end" mt="md">
            <Button type="submit">送信する</Button>
          </Group>}
        </Stack>
      </form>
    </Container>
  )
}
