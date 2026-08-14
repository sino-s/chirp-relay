# Chirp Relay

`twitter-api-safe-relay` に接続する、閲覧専用の軽量モバイル PWA です。Preact、Tailwind CSS、Vite で構成しています。

## Local development

relay を `localhost:4545` で起動してから実行します。

```bash
pnpm install
pnpm dev
```

ブラウザで `http://localhost:5173` を開き、relay URL と `/profiles` に表示されるプロフィールを選択してください。

```bash
pnpm test
VITE_RELAY_INTEGRATION=1 VITE_RELAY_BASE_URL=http://localhost:4545 pnpm test src/api/live.test.ts
pnpm build
pnpm preview
```

## GitHub Pages

`.github/workflows/deploy-pages.yml` が `main` ブランチへの push でテスト、ビルド、Pages へのデプロイを行います。リポジトリの Settings → Pages → Source は **GitHub Actions** を選択してください。

公開版からは HTTPS の relay だけに接続できます。relay 側では次の origin とリクエストを許可します。

- Origin: `https://<owner>.github.io`
- Methods: `GET`, `POST`, `OPTIONS`
- Headers: `Content-Type`, `X-Profile-Name`

relay は Tailscale Serve を使って tailnet 内限定の HTTPS URL にすることを想定しています。GitHub Pages 自体は公開されますが、relay のデータは Tailscale 接続中の端末からだけ取得できます。

## Privacy and limitations

- 設定として relay URL とプロフィール名だけを localStorage に保存します。
- Service Worker はアプリの静的ファイルだけをキャッシュし、relay の応答はキャッシュしません。
- 投稿、いいね、フォローなどの書き込み操作には対応していません。
- Twitter Web の非公開 GraphQL operation は変更される可能性があります。更新が必要な場合は `src/api/operations.ts` を relay の最新 request catalog に合わせます。
