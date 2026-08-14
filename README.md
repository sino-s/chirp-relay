# Chirp Relay

`twitter-api-safe-relay` に接続する、Preact + Tailwind CSS製の軽量TwitterクライアントPWAです。モバイル版Twitterに近い操作感を目指し、GitHub Pagesで動作する構成にしています。

公開URL: https://sino-s.github.io/chirp-relay/

## Features

- おすすめ、フォロー中、選択したリストのホームタイムライン
- 投稿詳細と返信
- 画像ビューアと動画再生
- 自分・他ユーザーのプロフィール、投稿、メディア、いいね
- 通知、検索、リスト、ブックマーク一覧
- テキスト投稿
- いいね、リツイート、ブックマークの追加と解除
- Relay内の複数プロフィール切り替え
- 引き下げ更新、画面とスクロール位置の保持
- PWAインストールとオフラインでのアプリシェル起動

画像付き投稿やプロフィール編集などには対応していません。

## Local development

[pnpm](https://pnpm.io/) とNode.js 22以降を使用します。Relayを `localhost:4545` で起動してから実行してください。

```bash
pnpm install
pnpm dev
```

ブラウザで `http://localhost:5173` を開き、Relay URLと `/profiles` に表示されるプロフィールを選択します。

```bash
pnpm test
VITE_RELAY_INTEGRATION=1 VITE_RELAY_BASE_URL=http://localhost:4545 pnpm vitest run src/api/live.test.ts
pnpm build
pnpm preview
```

## GitHub Pages

`.github/workflows/deploy-pages.yml` が `main` ブランチへのpush時にテストとビルドを行い、`dist`をGitHub Pagesへデプロイします。

リポジトリの `Settings` → `Pages` → `Build and deployment` で、Sourceを **GitHub Actions** に設定してください。Viteのアセット、PWA manifest、Service WorkerはPagesのサブディレクトリから動作するよう相対パスで構成されています。

## Relay configuration

HTTPSのGitHub Pagesから接続するため、公開環境ではRelayにもHTTPS URLが必要です。Tailscale Serveなどを利用して、必要な端末だけがRelayへ到達できる構成を推奨します。

RelayのCORSには次を許可してください。

```text
Origin: https://sino-s.github.io
Methods: GET, POST, OPTIONS
Headers: Content-Type, X-Profile-Name
```

カスタムドメインを使用する場合は、そのOriginも追加してください。Originには `/chirp-relay/` のようなパスは含めません。

## Privacy and limitations

- GitHub Pages上のアプリ自体は公開されます。Relayをインターネットへ無制限に公開しないでください。
- Relay URL、選択中のプロフィール、ホームに表示するリストはブラウザのlocalStorageへ保存されます。
- Twitterの認証情報やRelayのプロフィールデータは、このリポジトリやGitHub Pagesのビルドには含まれません。
- Service Workerはアプリの静的ファイルだけを事前キャッシュし、RelayのAPIレスポンスはキャッシュしません。
- Twitter Webの非公開GraphQL operationを利用するため、Twitter側の変更に合わせて `src/api/operations.ts` の更新が必要になる場合があります。
