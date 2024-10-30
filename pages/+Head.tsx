// https://vike.dev/Head

import logoUrl from "../assets/logo.svg";

import { ColorSchemeScript } from "@mantine/core";

export default function HeadDefault() {
  return (
    <>
      <link rel="icon" href={logoUrl} />
      <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap&text=0123456789" rel="stylesheet" />
      <ColorSchemeScript />
    </>
  );
}
