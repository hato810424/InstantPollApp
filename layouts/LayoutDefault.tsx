import "@mantine/core/styles.css";
import '@mantine/charts/styles.css';
import "./style.css";

import React, { Suspense } from "react";
import { Vote } from "lucide-react";

import { AppShell, Center, MantineProvider } from "@mantine/core";
import theme from "./theme";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { css } from "@compiled/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      gcTime: Infinity,
      staleTime: 1000 * 60 * 5, // 5分キャッシュ
    }
  }
});

export default function LayoutDefault({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        <Suspense>
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
        </Suspense>
      </MantineProvider>
    </QueryClientProvider>
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
