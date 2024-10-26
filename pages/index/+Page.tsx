import React, { useEffect, useState } from "react";

import type { AppType } from "../../server/api.js";
import { hc } from 'hono/client';
import { useData } from "vike-react/useData";
import { Data } from "./+data.js";

export default function Page() {
  const { user } = useData<Data>();

  const rpc = hc<AppType>("/");
  const [username, setUsername] = useState<string>(user ? user.username : "ゲストさん");
  const [userId, setUserId] = useState<string | undefined>(user && user.id);

  useEffect(() => {
    (async() => {
      const result = await rpc.api["@me"].$get();

      const data = await result.json();

      if (result.ok) {
        setUsername(data.username);
        setUserId(data.id)
      }
    })();
  }, [])
  
  return (
    <>
      <h2>アンケートアプリをつくり<s>たかった</s><br/>けど時間がなくて名前記憶機能しかできなかった</h2>
      {/* <ul>
        <li>Rendered to HTML.</li>
        <li>
          Interactive. <Counter />
        </li>
      </ul> */}
      <p>あなたの名前「{username}」（{userId}）</p>
      <form onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const username = (form.get("username") ?? "").toString();
        rpc.api["@me"].$put({
          form: {
            username: username,
          }
        }).then(() => [
          setUsername(username)
        ])
      }}>
        <label>
          名前変更:
          <input type="text" name="username" defaultValue="" required />
        </label>
        <button>これにする（タップ or クリック）</button>
      </form>
    </>
  );
}
