import { AnswersType, Users } from "@/database/drizzle/queries/answers"
import { FormComponentData } from "@/pages/poll/create/+Page"
import { Accordion, Fieldset, List, Paper, Space, Stack, Text } from "@mantine/core"
import { BarChart, ChartTooltipProps } from "@mantine/charts";

export type RadioButtonResultProps = {
  content: FormComponentData<"radio">,
  users: Users,
  answers?: AnswersType[""]
}

function ChartTooltip({ label, payload }: ChartTooltipProps) {
  if (!payload) return null;

  return (
    <Paper px="md" py="sm" withBorder shadow="md" radius="md">
      <Text fw={500} mb={5}>
        {label}
      </Text>
      {payload.map((item: any) => (
        <Text key={item.name} fz="sm">
          を選択した人数 「{item.value}人」
        </Text>
      ))}
    </Paper>
  );
}

export const RadioButtonResult = ({
  content,
  users,
  answers,
}: RadioButtonResultProps) => {
  const data = content.data.questions.map(question => {
    return {
      label: question.label,
      count: ((answers && answers[question.key]) ?? []).length
    }
  })

  return (
    <Fieldset legend={`「${content.data.title}」への回答`} radius={"md"}>
      <Space h="lg" />
      <Stack>
        <BarChart
          h={content.data.questions.length * 50}
          data={data}
          dataKey="label"
          orientation="vertical"
          yAxisProps={{ 
            allowDecimals: false
          }}
          xAxisProps={{
            allowDecimals: false
          }}
          barProps={{ radius: 10 }}
          series={[{ name: 'count', color: 'blue.6' }]}
          tooltipAnimationDuration={50}
          tooltipProps={{
            content: ({ label, payload }) => <ChartTooltip label={label} payload={payload} />,
          }}
        />
        {answers && (
          <Accordion chevronPosition="right" variant="contained">
            <Accordion.Item value={"list"}>
              <Accordion.Control>回答者を見る</Accordion.Control>
              <Accordion.Panel>
                <Stack>
                  {content.data.questions.map(question => (
                    <Fieldset key={question.label} legend={`「${question.label}」を選択した人`}>
                      <List>
                        {!answers[question.key] || (answers[question.key].length === 0) ? (
                          <Text m={0}>いませんでした。</Text>
                        ) : answers[question.key].map(userId => {
                          if (users[userId] !== undefined) {
                            return (
                              <List.Item key={question.key + userId}>{users[userId] === null ? "名前非公開さん" : users[userId]}</List.Item>
                            )
                          } else {
                            return (
                              <List.Item key={question.key + userId}>名前の取得に失敗しました</List.Item>
                            )
                          }
                        })}
                      </List>
                    </Fieldset>
                  ))}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        )}
      </Stack>
    </Fieldset>
  )
}
