import React, { useEffect, useState } from "react";
import { Counter } from "./Counter.js";

import type { AppType } from "../../hono-api.js";
import { hc } from 'hono/client';

export default function Page() {
  const rpc = hc<AppType>("/");
  const [username, setUsername] = useState<string>();
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    (async() => {
      const result = await rpc.api["@me"].$get();

      const data = await result.json();

      setUsername(result.ok ? data.username : "ゲスト");
      setUserId(result.ok ? data.id : undefined)
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
      <p>あなたの名前「{username}」</p>
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
        <button>これにする（タップ + クリック）</button>
      </form>
    </>
  );
}
