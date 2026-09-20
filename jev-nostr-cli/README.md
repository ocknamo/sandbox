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
呼び出し側のコードで書く、というのが設計思想です。

### 聞いていること（`internal/recommend/questions.go`）

| キー | 型 | 役割 |
| --- | --- | --- |
| `insight` | `noul` | 読み手が知らないことや、考える材料を渡しているか |
| `humor` | `noul` | 笑わせようとしていて、実際に成功しているか |
| `relatable` | `noul` | 見知らぬ人が「わかる」と思う感覚を書いているか |
| `promotional` | `noul` | 宣伝・勧誘・誘導か（拒否用） |
| `substance` | `score` | 読み手にとっての中身の量（5 段階） |
| `kind` | `choice` | 投稿の種類（表示用ラベル） |

肯定シグナルを3つに分けてあるのは、**投稿はそのうちどれか1つで十分に価値を持つ**
からです。ダジャレに洞察を求めても仕方がなく、ぼやきに情報量を求めても仕方がない。
単一の「良い投稿か？」ではこの区別ができません。

**6つ聞いてもコストはほとんど増えません。** 1リクエスト約 350 入力トークンのうち
300 前後は固定費で、質問は並列に評価されます。高いのは**質問の数ではなくリクエストの数**
です。

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
| `-appeal` | `0.5` | 最も強い肯定シグナルがこの値以上なら採用 |
| `-promotional` | `0.5` | この値以上なら宣伝として拒否 |
| `-raw` | `false` | 生のレスポンス JSON も表示する |

`TYPESAFE_ENDPOINT` を設定すると接続先を差し替えられます。開発中にスタブサーバへ
向けるための逃げ道で、本番では使いません。

出力はこうなります（値は実際の応答によります）:

```text
asking "jev-latest" 6 questions about 5 posts (appeal >= 0.50, promotional veto >= 0.50)

0be17f5ebe0a  How does the man in the moon get his hair cut? Eclipse i…  (2.1s)
    insight 0.10 | humor 0.90 | relatable 0.19 | promotional 0.03
    substance 2 (An ordinary observation) | kind humor 0.81
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

## 構成

```
main.go               CLI。投稿を読み、質問し、結果を並べる
internal/jev/         System One API のクライアント。型定義と POST だけ
internal/recommend/   「何を聞くか」と「どう合成するか」。API 本体でもこれを使う
testdata/             サンプルの Nostr イベント
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

**`substance`（score）はまだ判定に使っていません。** API のドキュメントは score が
ルーブリックの何番目かを返すと書いていますが、0 始まりか 1 始まりかを書いていません。
取り違えるとしきい値が静かにずれるので、今は**順序しか意味を持たないランキングの
タイブレーク**にだけ使っています。実際の応答を見てから判定に組み込みます。

**`Answer` の数値フィールドがポインタなのは、0 が意味のある答えだから**です。
`noul` の 0 は「いいえ」であって、サーバが値を返さなかったことと同じではありません。

## 課金とレート制限

入力トークンのみ課金（10 億トークンあたり $42）、出力は無料。
レート制限は 250,000 トークン/秒 または 1,200 リクエスト/分。
コンテキストは 1 リクエスト 64k トークン、うち `state` は 32k まで。

## 次のステップ

1. ~~CLI で往復を確認する~~
2. ~~質問と `criteria` を設計して合成スコアにする~~ ← 今ここ
3. Nostr 側のダミーサーバ（投稿 ID を返す HTTP サーバ）を作る
4. おすすめタイムライン API 本体：取得 → Jev でフィルタ → ID を返す
5. `confidence` によるルーティング、並列化、キャッシュ

Step 4 では**並列化が必須**です。1リクエスト約 2 秒なので、100 件を逐次で回すと
3 分以上かかります。レート制限は 1,200 req/分 = 20 req/秒で、トークン制限
（250k/秒）にはまったく届かないため、**効くのはリクエスト数のほう**です。
