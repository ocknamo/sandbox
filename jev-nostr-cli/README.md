# jev-nostr-cli

Nostr の投稿を [TypeSafe の Jev](https://docs.typesafe.ai/introduction) に投げて、
返ってきた判定を表示するだけの小さな CLI です。「おすすめタイムライン API」の
**Step 1**、つまり往復が成立することと System One の答えの形を確かめるための足場です。

## Jev とは

LLM は人間が読むテキストを返しますが、Jev が返すのは**コードが直接分岐できる型付きの値**です。
1 回のリクエストに複数の質問を入れられ、それらは並列に評価されるので、質問を増やしても
レイテンシはほとんど増えません。

| プリミティブ | 用途 | `criteria` | 返る値 |
| --- | --- | --- | --- |
| `noul` | 真偽の判定 | 任意（`true` / `false` の説明） | `noul`（0〜1） |
| `choice` | 選択肢から 1 つ選ぶ | 必須・`{選択肢: 説明}`（最大 255） | `choice`, `probabilities`, `confidence` |
| `score` | ルーブリックで採点 | 必須・順序付き配列（2〜10 段階） | `score`, `legend`, `probabilities`, `confidence` |

質問は「知識のある人が数秒で判断できる」粒度まで分解し、組み合わせのロジックは
呼び出し側のコードで書く、というのが設計思想です。Step 1 では `noul` を 1 つだけ聞いています。

Go の SDK は存在しないため、`internal/jev` で `net/http` から直接叩いています。

## 使い方

```sh
export TYPESAFE_API_KEY=...
go run .
```

| フラグ | 既定値 | 内容 |
| --- | --- | --- |
| `-posts` | `testdata/posts.json` | Nostr イベントの配列が入った JSON ファイル |
| `-model` | `jev-latest` | モデル識別子（`jev-latest` → `jev-1.13.0`） |
| `-threshold` | `0.5` | この値以上の `noul` を「おすすめ」とみなす |
| `-raw` | `false` | 生のレスポンス JSON も表示する |

`TYPESAFE_ENDPOINT` を設定すると接続先を差し替えられます。開発中にスタブサーバへ
向けるための逃げ道で、本番では使いません。

出力はこうなります（値は実際の応答によります）:

```text
asking "jev-latest" about 6 posts (threshold 0.50)

f98027190d69  noul=0.891  RECOMMEND  Go の context でハマった話。http.Request の Context は…
417e06653a50  noul=0.042  skip       gm
...

2 of 6 posts recommended, 173 input tokens
```

## 動作確認は CI で行う

この環境には API キーを置けないため、**実際の API 呼び出しは GitHub Actions で確認します**。

1. リポジトリの Settings → Secrets and variables → Actions で
   `TYPESAFE_API_KEY` を登録する
2. `jev-nostr-cli/` 以下に push する

`.github/workflows/jev-nostr-cli-ci.yml` が 2 つのジョブを実行します。

- **Build and test** — `go vet` / `gofmt` / `go test -race`。ネットワークには触れません。
- **Live Jev call** — サンプル投稿を実際の API に送り、結果を**ジョブのサマリーに表示**します。
  Secret が未登録の場合は失敗させず、その旨をサマリーに書いてスキップします
  （fork からの PR には Secret が渡らないため）。

Cloud Run のサービスと違い、このワークフローは main 以外のブランチへの push でも動きます。
`workflow_dispatch` はワークフローファイルがデフォルトブランチに入るまで UI に出てこないので、
作業ブランチの段階で実際の応答を見るにはこれが必要です。

## 構成

```
main.go              CLI。投稿を読み、1 件ずつ質問し、結果を表示する
internal/jev/        System One API のクライアント。型定義と POST だけ
testdata/posts.json  サンプルの Nostr イベント（中身のある投稿と雑音を混ぜてある）
```

`Answer` の数値フィールドがポインタなのは、**0 が意味のある答えだから**です。
`noul` の 0 は「いいえ」であって、サーバが値を返さなかったことと同じではありません。

## 課金とレート制限

入力トークンのみ課金（10 億トークンあたり $42）、出力は無料。
レート制限は 250,000 トークン/秒 または 1,200 リクエスト/分。
コンテキストは 1 リクエスト 64k トークン、うち `state` は 32k まで。

## 次のステップ

1. ~~CLI で往復を確認する~~ ← 今ここ
2. 質問と `criteria` を設計してリコメンド判定の精度を見る
3. Nostr 側のダミーサーバ（投稿 ID を返す HTTP サーバ）を作る
4. おすすめタイムライン API 本体：取得 → Jev でフィルタ → ID を返す
5. `confidence` によるルーティング、並列化、キャッシュ
