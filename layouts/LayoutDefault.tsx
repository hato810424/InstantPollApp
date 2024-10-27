import "@mantine/core/styles.css";
import "./style.css";

import React from "react";
import logoUrl from "../assets/logo.svg";
import { Link } from "../components/Link.js";
import { TextQuote, Vote } from "lucide-react";

import { AppShell, AppShellHeader, Center, Container, Group, MantineProvider } from "@mantine/core";
import theme from "./theme";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { css } from "@compiled/react";

export default function LayoutDefault({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme}>
      <AppShell
        header={{ 
          height: "md",
          offset: false,
        }}
        padding="md"
      >
        <AppShell.Main>
          <header css={css({
          })}>
            <Center m={"md"}>
              <Vote size="20" />インスタントアンケートアプリ
            </Center>
          </header>
          {children}
        </AppShell.Main>
      </AppShell>
      <ReactQueryDevtools initialIsOpen={false} />
    </MantineProvider>
  );
}

function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <div
      id="sidebar"
      style={{
        padding: 20,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        lineHeight: "1.8em",
        borderRight: "2px solid #eee",
      }}
    >
      {children}
    </div>
  );
}

function Content({ children }: { children: React.ReactNode }) {
  return (
    <div id="page-container">
      <div
        id="page-content"
        style={{
          padding: 20,
          paddingBottom: 50,
          minHeight: "100vh",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div
      style={{
        marginTop: 20,
        marginBottom: 10,
      }}
    >
      <a href="/">
        <img src={logoUrl} height={64} width={64} alt="logo" />
      </a>
    </div>
  );
}
