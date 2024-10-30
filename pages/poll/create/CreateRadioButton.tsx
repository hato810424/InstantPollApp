import clsx from "clsx";
import { Button, Center, CloseButton, Fieldset, Grid, Stack, Text, TextInput } from "@mantine/core";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import classes from './DndListHandle.module.css';
import { GripVertical } from "lucide-react";
import { useForm } from "@mantine/form";
import { nanoid } from "nanoid";
import { memo } from "react";
import { style } from "@macaron-css/core";

export type RadioButtonData = {
  title: string,
  questions: {
    label: string,
    key: string,
  }[]
};
export type RadioButtonProps = {
  initialValues: RadioButtonData,
  setData: (data: RadioButtonData) => void,
  remove: () => void,
  error?: string,
}

const errorStyle = style({
  borderColor: "var(--mantine-color-red-6)",
});

export const CreateRadioButton = memo(({
  initialValues,
  setData,
  remove,
  error,
}: RadioButtonProps) => {
  const form = useForm<RadioButtonData>({
    mode: 'uncontrolled',
    initialValues: {
      title: initialValues.title,
      questions: initialValues.questions,
    },
    onValuesChange: (data) => {
      setData(data);
    }
  });

  const items = form.getValues().questions.map((item, index) => (
    <Draggable key={item.key} index={index} draggableId={item.key}>
      {(provided, snapshot) => (
        <Grid pr={"sm"}
          className={clsx(classes.item, { [classes.itemDragging]: snapshot.isDragging })}
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <Center>
            <Grid.Col span="content" {...provided.dragHandleProps} className={classes.dragHandle}>
              <GripVertical />
            </Grid.Col>
          </Center>
          <Grid.Col span="auto">
            <TextInput
              placeholder="選択肢"
              key={form.key(`questions.${index}.label`)}
              {...form.getInputProps(`questions.${index}.label`)}
            />
          </Grid.Col>
          <Center>
            <Grid.Col span="content">
              <CloseButton onClick={() => form.removeListItem('questions', index)} />
            </Grid.Col>
          </Center>
        </Grid>
      )}
    </Draggable>
  ));

  return (
    <Fieldset legend="ラジオボタン" className={clsx(error && errorStyle)}>
      <Stack>
        <Grid>
          <Grid.Col span="auto">
            <TextInput 
              placeholder="質問"
              key={form.key("title")}
              {...form.getInputProps("title")}
            />
          </Grid.Col>
          <Grid.Col span="content">
            <Button color="red" onClick={() => {
              remove();
            }}>質問を削除</Button>
          </Grid.Col>
        </Grid>

        <Button size="xs" onClick={() => {
          form.insertListItem(
            'questions',
            {
              label: "",
              key: nanoid(),
            }
          )
        }}>選択肢を追加</Button>

        <DragDropContext
          onDragEnd={({ destination, source }) =>
            destination?.index !== undefined && form.reorderListItem('questions', { from: source.index, to: destination.index })
          }
        >
          <Droppable droppableId="dnd-list" direction="vertical">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {items}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {error && <Text c="red" size="sm">{error}</Text>}
      </Stack>
    </Fieldset>
  )
});
