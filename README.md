# hato810424/InstantPollApp

```sh
pnpm install
```

## Drizzle
`.env`ファイルで`DATABASE_URL`が設定されていることを確認し、データベースを作成してください

```bash
pnpm run drizzle:generate
pnpm run drizzle:migrate
```

Read more on [Drizzle ORM documentation](https://orm.drizzle.team/docs/overview)

### Drizzle Studio
Drizzleには便利なビュワーが実装されています。
```bash
pnpm run drizzle:studio
```

## Ngrok
Ngrokを使用するためには `.env`ファイルの`NGROK_AUTHTOKEN`にNgrokトークンを入力してください。

Ngrokを起動する
```bash
pnpm run ngrok
```

> [!NOTE]
> Ngrokはデフォルトで3000ポートをバイパスします<br/>
> このとき実行されるファイルは `./ngrok.ts` です 

## 開発
開発サーバーを起動する
```bash
pnpm run dev
```

## 本番環境
ビルド
```bash
pnpm run build
```

ビルドしたものを本番で起動する
```bash
pnpm run start
```
