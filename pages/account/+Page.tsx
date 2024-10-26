import React from "react";
import type { Data } from "./+data";
import { useData } from "vike-react/useData";

export default function Page() {
  const { user } = useData<Data>();
  
  console.log(user);

  return (
    <>
      <h1>Account</h1>
      {user && (
        <p>{user.id} - {user.username}</p>
      )}
    </>
  );
}
