# jev-nostr

Nostr の投稿を [TypeSafe の Jev](https://docs.typesafe.ai/introduction) に判定させ、
「おすすめタイムライン」に残すかを決めます。

| コマンド | 役割 |
| --- | --- |
| `cmd/cli` | 手元のサンプル投稿を判定して、全シグナルを並べるベンチ。質問のチューニング用 |
| `cmd/server` | Cloud Run 上のスコアリング API。GitHub Pages のページが呼ぶ |

判定そのもの（`internal/recommend`）は両方で共有しているので、CLI で調整した結果が
そのまま API に効きます。

## Jev とは

LLM は人間が読むテキストを返しますが、Jev が返すのは**コードが直接分岐できる型付きの値**です。
1 回のリクエストに複数の質問を入れられ、それらは並列に評価されるので、質問を増やしても
レイテンシはほとんど増えません。

| プリミティブ | 用途 | `criteria` | 返る値 |
| --- | --- | --- | --- |
| `noul` | 真偽の判定 | 任意（`true` / `false` の説明） | `noul`（0〜1） |
| `choice` | 選択肢から 1 つ選ぶ | 必須・`{選択肢: 説明}`（最大 255） | `choice`, `probabilities`, `confidence` |
| `score` | ルーブリックで採点 | 必須・順序付き配列（2〜10 段階） | `score`（期待値・小数）, `legend`, `probabilities`, `confidence` |

質問は「知識のある人が数秒で判断できる」粒度まで分解し、組み合わせのロジックは
呼び出し側のコードで書く、というのが設計思想です。

### 聞いていること（`internal/recommend/questions.go`）

| キー | 型 | 役割 |
| --- | --- | --- |
| `insight` | `noul` | 読み手が知らないことや、考える材料を渡しているか |
| `humor` | `noul` | 笑わせようとしていて、実際に成功しているか |
| `relatable` | `noul` | 見知らぬ人が「わかる」と思う感覚を書いているか |
| `promotional` | `noul` | 宣伝・勧誘・誘導か（拒否用） |
| `substance` | `score` | 読み手にとっての中身の量（5 段階 = `0.0`〜`4.0`） |
| `kind` | `choice` | 投稿の種類（表示用ラベル） |
| `language` | `choice` | 何語で書かれているか |

肯定シグナルを3つに分けてあるのは、**投稿はそのうちどれか1つで十分に価値を持つ**
からです。ダジャレに洞察を求めても仕方がなく、ぼやきに情報量を求めても仕方がない。
単一の「良い投稿か？」ではこの区別ができません。

**7つ聞いてもコストはほとんど増えません。** 1リクエストの入力トークンの多くが固定費で、
質問は並列に評価されます。高いのは**質問の数ではなくリクエストの数**です。

`language` は `choice` ひとつで済ませています。**欲しいのは勝った選択肢ではなく
確率分布のほう**で、`probabilities["ja"]` がそのまま「日本語らしさ」になります。
言語ごとに `noul` を並べると言語の数だけ質問が要りますが、`choice` なら1問で全言語を
カバーでき、しかも**読み手が後から言語を変えても再判定が不要**です。混在した投稿は
複数の言語に重みが散るので、しきい値を下げれば拾えます。

Go の SDK は存在しないため、`internal/jev` で `net/http` から直接叩いています。

## CLI

```sh
export TYPESAFE_API_KEY=...
go run ./cmd/cli
```

| フラグ | 既定値 | 内容 |
| --- | --- | --- |
| `-posts` | `testdata/posts.json` | Nostr イベントの配列が入った JSON ファイル |
| `-model` | `jev-latest` | モデル識別子（`jev-latest` → `jev-1.13.0`） |
| `-appeal` | `0.5` | 最も強い肯定シグナルがこの値以上なら採用 |
| `-promotional` | `0.5` | この値以上なら宣伝として拒否 |
| `-raw` | `false` | 生のレスポンス JSON も表示する |

`TYPESAFE_ENDPOINT` を設定すると接続先を差し替えられます（CLI・サーバ共通）。
開発中にスタブサーバへ向けるための逃げ道で、本番では使いません。

出力はこうなります（値は実際の応答によります）:

```text
asking "jev-latest" 7 questions about 5 posts (appeal >= 0.50, promotional veto >= 0.50)

0be17f5ebe0a  How does the man in the moon get his hair cut? Eclipse i…  (2.1s)
    insight 0.10 | humor 0.90 | relatable 0.19 | promotional 0.03
    substance 1.43/4 (An ordinary observation: clear, but slight.) | kind humor 0.81 | language en 0.94 / ja 0.04
    => RECOMMEND on humor (appeal 0.90)
...

timeline: 2 of 5 posts
  1. 0be17f5ebe0a  0.90 humor      How does the man in the moon get his hair cut?…
```

### サンプル

| ファイル | 中身 |
| --- | --- |
| `testdata/posts.json` | **実際の Nostr の投稿**（そのまま）。既定で使われる |
| `testdata/synthetic.json` | 手で書いたサンプル。実データのほうに無いスパムが入っている |

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

## スコアリング API と Web ページ

https://ocknamo.github.io/sandbox/jev.html が、リレーから流れてくる投稿を
リアルタイムに判定して並べます。

```
ブラウザ ──WebSocket──> Nostr リレー        （投稿を受け取る）
   │
   └──── POST /api/score ────> Cloud Run ────> api.typesafe.ai
                               （API キーを持つ）
```

**なぜバックエンドが要るのか。** `api.typesafe.ai` はブラウザからのオリジンを
拒否します（`Disallowed CORS origin`）。仮に許可されていたとしても、静的ページに
API キーは置けません。投稿の取得はリレーから直接なので、API を経由するのは判定だけです。

### しきい値はブラウザ側で適用します

`/api/score` は**シグナルだけを返し、採否を返しません**。

```json
{"results": [{"id": "…", "insight": 0.90, "humor": 0.09, "relatable": 0.44,
              "promotional": 0.02, "appeal": 0.90, "reason": "insight",
              "substance": 3.84, "substance_top": 4, "kind": "insight",
              "kind_confidence": 0.98, "language": "ja",
              "language_scores": {"ja": 0.93, "en": 0.05, "none": 0.02}}]}
```

採否を返してしまうと、しきい値がサーバ側に固定されます。シグナルを返せば、
**スライダーを動かしても再判定は走りません** — 待ち時間ゼロ、追加コストゼロです。
`recommend.Policy` と同じルールをページ側の `verdict()` が持っています。

`language_scores` も同じ理由で分布ごと返しています。**どの言語のタイムラインが
欲しいかは投稿の性質ではなく読み手の都合**なので、サーバが決めてしまうと
読み手が気を変えるたびに聞き直すことになります。

ページは日本語と英語を切り替えられます（初回はブラウザの言語、以降は選択を保存）。
言語フィルタの選択肢は `/api/questions` から取得しているので、**モデルに実際に
渡している選択肢と食い違うことがありません**。

| エンドポイント | 内容 |
| --- | --- |
| `POST /api/score` | `{"posts":[{"id","content"}]}` を判定。1 リクエスト最大 30 件 |
| `GET /api/questions` | 実際に投げている質問文。ページが根拠を表示するのに使う |
| `GET /health` | デプロイパイプラインが叩く |

1 投稿 = 1 リクエストなので、バッチは**並列に**処理します（`internal/scorer`）。
同時実行数 4 は、公称 1,200 req/分 = 20 req/秒 を 1 件 220ms で割った数字です。

ローカルで動かす場合:

```sh
TYPESAFE_API_KEY=... go run ./cmd/server
# 別の端末で docs/jev.html を開き、?api=http://localhost:8080 を付ける
```

## 構成

```
cmd/cli/              質問チューニング用のベンチ
cmd/server/           Cloud Run のエントリポイント
internal/jev/         System One API のクライアント。型定義と POST、429 のリトライ
internal/recommend/   「何を聞くか」と「どう合成するか」。CLI と API が共有する
internal/scorer/      バッチを並列に判定する
internal/server/      HTTP ルーティングと入力の上限
testdata/             サンプルの Nostr イベント
../docs/jev.html      GitHub Pages のフロントエンド
```

### 設計メモ

**Jev に聞くのは「その投稿が何であるか」だけ**で、「それをどう扱うか」は Go 側の
ポリシーです（`recommend.Policy`）。しきい値を動かすのに API を呼び直す必要はなく、
判断の根拠がテストできる場所に残ります。

**`Appeal` は3つの肯定シグナルの最大値で、平均ではありません。**
良いダジャレは出来の悪い論説ではないからです。`humor 0.92 / insight 0.05 /
relatable 0.10` の投稿は平均 0.36 で埋もれますが、最大値なら 0.92 で通ります。
読む理由がひとつでもあれば、それは読む理由です。

**宣伝は減点ではなく拒否**です。よく書けた広告は、やはり広告です。

**`score` はインデックスではなく期待値です。** レベル番号をその確率で重み付けして
足したもので、**レベルの間の小数**になります。5 段階なら `0.0`〜`4.0`（0 始まり）。

```json
{"type": "score", "score": 1.43, "confidence": 0.35,
 "legend": {"0": "…", "1": "…", "2": "…"},
 "probabilities": {"0": 0.0, "1": 0.57, "2": 0.43}}
```

`0×0.0 + 1×0.57 + 2×0.43 = 1.43`。`legend` は**文字列ではなくレベル番号をキーにした
オブジェクト**です。最初のライブ実行はここを取り違えて落ちました
（`internal/jev/jev_test.go` に実際の形状を固定してあります）。

**`substance` はまだ判定に使っていません。** 0/1 ではなく段階的な値なので、
組み込むには「noul 3つに対してどれだけの重みを持たせるか」を決める必要があり、
実際の応答を見るまで根拠がありません。今は**順序しか意味を持たないランキングの
タイブレーク**にだけ使っています。

**`Answer` の数値フィールドがポインタなのは、0 が意味のある答えだから**です。
`noul` の 0 は「いいえ」であって、サーバが値を返さなかったことと同じではありません。

## 課金とレート制限

入力トークンのみ課金（10 億トークンあたり $42）、出力は無料。
レート制限は 250,000 トークン/秒 または 1,200 リクエスト/分。
コンテキストは 1 リクエスト 64k トークン、うち `state` は 32k まで。

## 次のステップ

1. ~~CLI で往復を確認する~~
2. ~~質問と `criteria` を設計して合成スコアにする~~
3. ~~スコアリング API と、リアルタイムに判定する Web ページ~~ ← 今ここ
4. `relatable` の作り直し（下記）
5. `substance` を判定に組み込むかを決める
6. `confidence` によるルーティング、キャッシュ

### 分かっている課題

**`relatable` が効いていません。** 実測で 0.14〜0.50 の帯から出ず、一度も高く出ず、
一度も決定的に低く出ません。「ラーメン食べた」がちょうど 0.50 でしきい値を
すり抜けたのがその表れです。`insight`（0.06〜0.93）や `promotional`（0.02〜0.99）が
綺麗に二極化しているのと対照的で、質問文を作り直す必要があります。

**`substance` が一番よく分離しています。** 中身のある投稿 3.5+、`gm` は 0.00。
ページのスライダーで 1.5 あたりに上げると雑談が落ちるのが見えます。判定に
組み込むかどうかは、このスライダーで感触を掴んでから決めます。
