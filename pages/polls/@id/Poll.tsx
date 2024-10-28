import { normalWeight } from "../../../utils/styles";
import { Button, Container, Fieldset, Group, Radio, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useCallback } from "react";
import { PollItem } from "@/database/drizzle/schema/polls";
import { PollRadioButton, PollRadioButtonData, PollRadioButtonProps } from "./PollComponents";

type FormData = {
  [key: string]: PollRadioButtonData
};

const questionComponents = {
  radio: (props: PollRadioButtonProps) => <PollRadioButton {...props} />,
} as const;

export const Poll = ({
  poll,
  preview = false
}: {
  poll: PollItem,
  preview?: boolean
}) => {
  const transformFields = useCallback(() => poll.data.fields.reduce((result: FormData, fields) => {
    result[fields.key] = {
      key: fields.key,
      value: undefined,
    };
    return result;
  }, {}), [poll])();

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: transformFields,
  });

  return (
    <Container size="md">
      <small>{poll.data.author}によって作成された質問です</small>
      {preview ? (
        <h1 css={normalWeight}>「{poll.data.title}」のプレビュー</h1>
      ) : (
        <h1 css={normalWeight}>「{poll.data.title}」</h1>
      )}
      <p style={{ 
        whiteSpace: "pre-wrap",
      }}>{poll.data.description}</p>
      <form onSubmit={form.onSubmit(values => {
        const data = Object.values(values);
        let isError = false;

        data.forEach(value => {
          if (!(value.value)) {
            form.setErrors({
              ...form.errors,
              [value.key]: "入力してください"
            });
            isError = true;
          } else {
            form.clearFieldError(value.key);
          }
        })

        if (isError) return;
        console.log(data);
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
          <Group justify="flex-end" mt="md">
            <Button type="submit">送信する</Button>
          </Group>
        </Stack>
      </form>
    </Container>
  )
}
