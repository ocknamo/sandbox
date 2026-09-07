# sandbox

## Cloud Run サービス

各ディレクトリは、それぞれ独自の `go.mod` と `Dockerfile` を持つ独立したサービス
です。GitHub Actions から Workload Identity 連携を使って Cloud Run にデプロイし
ます（サービスアカウントキーは使いません）。

| ディレクトリ | Cloud Run サービス | 内容 |
| --- | --- | --- |
| [`go-cloudrun-app`](go-cloudrun-app) | `go-cloudrun-app` | 最小構成の JSON HTTP サービス |
| [`go-cloudrun-echo`](go-cloudrun-echo) | `go-cloudrun-echo` | リクエストを JSON でそのまま返すサービス |

### ワークフローの構成

`.github/workflows/deploy-service.yml` にデプロイのパイプライン全体を 1 か所にま
とめています。テスト、ビルド、プッシュ、デプロイを行い、その後に公開 URL の
`/health` をポーリングして、200 が返らなければ失敗させます。各サービスは薄い呼び
出し側ワークフロー（`deploy-<service>.yml`）を追加し、自分のサービス名とディレク
トリを渡したうえで、`paths` トリガーを自分のファイルだけに絞ります。これにより、
プッシュで再デプロイされるのは変更のあったサービスだけになります。同時実行の制御
はサービスごとにキーを分けているので、あるサービスのデプロイが別のサービスのデプ
ロイを待たされることはありません。

### サービスの停止と再開

Actions タブから **Manage Cloud Run services** を実行します。アクションと対象サー
ビスを指定するだけで、ローカルにツールを用意する必要はありません。

| アクション | 効果 |
| --- | --- |
| `status` | 各サービスの URL、`allUsers` がバインドされているか、`/health` の実際の応答を表示する |
| `pause` | `allUsers` の invoker バインディングを外し、URL が 403 を返すようにする |
| `resume` | バインディングを元に戻す |
| `delete` | サービスを削除する（一度に 1 つだけ。確認用フィールドにサービス名を再入力する必要がある） |

通常は `pause` を使います。IAM で拒否されたリクエストは課金されず、サービスの設定
とリビジョンはそのまま残り、`resume` を 1 回実行すれば元に戻せます。各アクション
は公開 URL をポーリングして自分の結果を検証し、`pause` 後もサービスに到達できる場
合は実行を失敗させます。したがって実行が成功していれば、本当に停止できていること
を意味します。

削除も実質的には元に戻せます。そのサービスのディレクトリ配下に次のプッシュを行え
ば、同じ URL に再びデプロイされます。

なお、ワークフローやサービスのソースを削除しても、稼働中のサービスは停止**しませ
ん**。デプロイ済みのリビジョンはこのリポジトリとは独立して GCP 上に存在します。

### サービスの追加

1. `Dockerfile` と、200 を返す `/health` エンドポイントを持つディレクトリを追加し
   ます。`/healthz` は使わ**ない**でください。このパスちょうどに対しては Google
   Front End 自身が応答してしまい、リクエストがコンテナまで届きません。
2. `deploy-<service>.yml` の呼び出し側ワークフローをコピーし、2 つの `paths` の
   エントリと `service` / `directory` の入力を変更します。
3. `go-cloudrun-ci.yml` のマトリクスにディレクトリを追加します。

GCP 側での作業は不要です。デプロイ用サービスアカウントはプロジェクトレベルで
`roles/run.admin` を持っており、すべてのイメージは 1 つの Artifact Registry リポジ
トリを共有します。サービスは既定で `GCP_RUNTIME_SA` を共有します。個別の ID を与
えたい場合は、サービスアカウントを作成し、デプロイ用サービスアカウントにそのサー
ビスアカウントに対する `roles/iam.serviceAccountUser` を付与したうえで、
`runtime_sa` 入力として渡してください。

プロジェクトの初回セットアップは
[`go-cloudrun-app/scripts/setup-gcp.sh`](go-cloudrun-app/scripts/setup-gcp.sh)
にあります。

## その他

- [`svelte-voice-api`](svelte-voice-api) — Svelte + Web Speech API の実験。
