# sandbox

## Cloud Run サービス

各ディレクトリは独立したサービスで、それぞれ専用の `go.mod` と `Dockerfile` を
持ちます。デプロイは GitHub Actions から Workload Identity Federation を使って
Cloud Run に対して行われます（サービスアカウントキーは不要です）。

| ディレクトリ | Cloud Run サービス | 内容 |
| --- | --- | --- |
| [`go-cloudrun-app`](go-cloudrun-app) | `go-cloudrun-app` | 最小構成の JSON HTTP サービス |
| [`go-cloudrun-echo`](go-cloudrun-echo) | `go-cloudrun-echo` | リクエストを JSON でそのまま返すサービス |
| [`go-cloudrun-bird`](go-cloudrun-bird) | `go-cloudrun-bird` | ランダムな鳥の画像を返す API（画像は Wikimedia Commons） |

### ワークフローの構成

`.github/workflows/deploy-service.yml` にデプロイパイプライン全体を一箇所にまとめて
あります。テスト、ビルド、プッシュ、デプロイを行い、その後デプロイ先 URL の
`/health` をポーリングして 200 が返らなければ失敗させます。各サービスは、その
サービス名とディレクトリを渡すだけの薄い呼び出し用ワークフロー
（`deploy-<service>.yml`）を追加し、`paths` トリガーを自分のファイルだけに絞って
います。これにより、プッシュで変更されたサービスだけが再デプロイされます。
並行実行の制御（concurrency）はサービスごとにキーを分けているため、あるサービスの
デプロイが別のサービスのデプロイを待たされることはありません。

### サービスの停止と再開

Actions タブから **Manage Cloud Run services** を実行します。アクションと対象
サービスを指定するだけで、ローカルのツールは不要です。

| アクション | 効果 |
| --- | --- |
| `status` | 各サービスの URL、`allUsers` がバインドされているか、`/health` の実行結果を表示 |
| `pause` | `allUsers` の invoker バインディングを削除し、URL が 403 を返すようにする |
| `resume` | バインディングを元に戻す |
| `delete` | サービスを削除（一度に 1 つだけ。確認用フィールドにサービス名の入力が必要） |

通常使うのは `pause` です。IAM によって拒否されたリクエストは課金されず、サービスの
設定やリビジョンはそのまま残り、`resume` の 1 回の実行で元に戻せます。

各アクションが変更するのは IAM ポリシーなので、成否の判断もそれで行います。実行後に
ポリシーを読み直し、バインディングが実際に変わっていなければ失敗とします。その後、
変更がフロントエンドまで反映されたことを確認するため、最大 10 分間ライブ URL を
ポーリングします。まだ切り替わっていない URL は失敗ではなく警告として報告されます。
これは [IAM の変更が反映されるまでに約 2 分、場合によっては 7 分以上かかる](https://docs.cloud.google.com/iam/docs/access-change-propagation)
ためです。つまり、実行が成功（緑）ならポリシーは変更済みであり、URL が確認できたか
まだ反映待ちかはサマリー行に表示されます。

削除は実質的には恒久的なものではありません。そのサービスのディレクトリ配下に次に
プッシュすれば、同じ URL に再びデプロイされます。

なお、ワークフローやサービスのソースを削除しても、稼働中のサービスは**停止しません**。
デプロイ済みのリビジョンはこのリポジトリとは独立して GCP 上に存在し続けます。

### 実行時間の上限

GitHub のデフォルトの 6 時間に頼らず、すべてのジョブで `timeout-minutes` を設定し、
デプロイ済みサービスに対する `curl` にはすべて `--max-time` を指定しています。
これにより、応答しないリクエストがランナーを占有し続けることはありません。

| ジョブ | 上限 | 通常の実行時間 |
| --- | --- | --- |
| `go-cloudrun-ci.yml` / `test` | 15 分 | マトリクス 1 件あたり 1 分未満 |
| `deploy-service.yml` / `deploy` | 20 分 | 約 2 分 |
| `manage-services.yml` / `manage` | 30 分 | 数秒（IAM の反映待ちが発生する場合を除く） |

デプロイの呼び出し側ワークフローには独自の上限を設定できません（再利用可能な
ワークフローを呼び出すジョブに `timeout-minutes` を指定すると GitHub が拒否する
ため）。そのため、上限は `deploy-service.yml` 側から適用されます。

### サービスの追加手順

1. `Dockerfile` と、200 を返す `/health` エンドポイントを持つディレクトリを追加します。
   `/healthz` は使わ**ない**でください。このパスは Google Front End 自身が応答して
   しまい、リクエストがコンテナまで届きません。
2. `deploy-<service>.yml` の呼び出し用ワークフローをコピーし、2 つの `paths` の
   エントリと `service` / `directory` の入力値を変更します。
3. `go-cloudrun-ci.yml` のマトリクスにディレクトリを追加します。

GCP 側の作業は不要です。デプロイ用サービスアカウントはプロジェクトレベルで
`roles/run.admin` を持ち、すべてのイメージは 1 つの Artifact Registry リポジトリを
共有します。各サービスはデフォルトで `GCP_RUNTIME_SA` を共有します。個別の
アイデンティティを与えたい場合は、サービスアカウントを作成し、デプロイ用サービス
アカウントにそのサービスアカウントへの `roles/iam.serviceAccountUser` を付与したうえ
で、`runtime_sa` の入力として渡してください。

プロジェクトの初期セットアップは
[`go-cloudrun-app/scripts/setup-gcp.sh`](go-cloudrun-app/scripts/setup-gcp.sh)
にあります。

## GitHub Pages

https://ocknamo.github.io/sandbox/ — `go-cloudrun-bird` のフロントエンド
（[`docs/index.html`](docs/index.html)）。詳細は
[`go-cloudrun-bird/README.md`](go-cloudrun-bird/README.md#フロントエンド)。

## その他

- [`svelte-voice-api`](svelte-voice-api) — Svelte + Web Speech API の実験。
