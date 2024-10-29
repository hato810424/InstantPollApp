import React from "react";
import { Center, Container } from "@mantine/core";

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return <>
    <Center m={"md"} p={0}>
      <a href="/">ホームに戻る</a>
    </Center>
    {children}
  </>;
}
