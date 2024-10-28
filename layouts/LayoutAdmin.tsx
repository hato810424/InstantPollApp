import React from "react";
import { Center, Container } from "@mantine/core";

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return (
    <Container size={"lg"}>
      <Center m={"md"}>
        <a href="/">ホームに戻る</a>
      </Center>
      {children}
    </Container>
  );
}
