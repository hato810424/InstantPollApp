import { normalWeight } from "@/utils/styles";
import { Container } from "@mantine/core";

export default function Page() {
  return (
    <Container size="md" p={0}>
      <h1 className={normalWeight}>存在しない質問のようです</h1>
    </Container>
  )
}
