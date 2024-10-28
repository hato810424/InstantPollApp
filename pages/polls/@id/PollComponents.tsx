import { Fieldset, Radio, Stack } from "@mantine/core";
import { FormComponentData } from "@/pages/poll/create/+Page";

export type PollRadioButtonData = {
  key: string,
  value?: string,
}

export type PollRadioButtonProps = {
  componentData: FormComponentData<"radio">,
  data: PollRadioButtonData,
  setData: (data: PollRadioButtonData) => void,
  error?: React.ReactNode,
}

export const PollRadioButton = ({
  componentData,
  data,
  setData,
  error,
}: PollRadioButtonProps) => {
  return (
    <Fieldset>
      <Radio.Group
        name={componentData.key}
        label={componentData.data.title}
        defaultValue={data.value}
        required
        error={error}
      >
        <Stack mt="xs">
          {componentData.data.questions.map((button, index) => (
            <Radio
              key={index}
              value={button.key}
              label={button.label}
              onChange={(e) => {
                setData({
                  ...data,
                  value: button.key,
                })
              }}
            />
          ))}
        </Stack>
      </Radio.Group>
    </Fieldset>
  )
};
