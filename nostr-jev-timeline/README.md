# nostr-jev-timeline

Nostr のリレーから最近の投稿を集め、[Jev](https://docs.typesafe.ai/)（TypeSafe の
System One モデル）で 1 件ずつ選別して、**おすすめ投稿の ID だけ**を返す HTTP API です。

本文もプロフィールも返しません。返すのは Nostr のイベント ID の配列だけなので、
クライアント側は手元のリレー接続でその ID を引き直して表示します。

```
GET /timeline?interests=nostr,bitcoin&lang=ja&limit=10

{"ids":["e3b0c442...","9f86d081...", ...]}
```

## 仕組み

```
リレー (kind:1)  ──▶  足切り  ──▶  Jev で判定  ──▶  閾値と並べ替え  ──▶  ID の配列
  querySync          空・短文       spam / quality      rank.ts
  新しい順に収集      重複・返信      relevance / language
```

判定は Jev に投げますが、**採否の閾値と並び順はこちら側（`src/rank.ts`）が持ちます**。
モデルには「この投稿はスパムか」「品質はどの段階か」といった答えの決まった質問だけを渡し、
「おすすめかどうか」という最終判断はコードで行う、という分担です。

### Jev に投げる質問

1 投稿 = 1 リクエストで、その 1 リクエストの中で複数の観点を同時に判定させます
（観点ごとにリクエストを分けると、Jev の「1 回で並列に判定する」長所を捨てることになります）。

| 質問 | 型 | 内容 |
| --- | --- | --- |
| `spam` | `noul` | スパム・詐欺・エアドロ乞食・bot 投稿か（0〜1 の確率） |
| `quality` | `score` | 通りすがりの読者にとっての読む価値（0〜4 の 5 段階ルーブリック） |
| `relevance` | `noul` | 読者の興味と合っているか（`interests` 指定時のみ） |
| `language` | `noul` | 指定言語で書かれているか（`lang` 指定時のみ） |

`state` には本文・ハッシュタグ・メディアの有無・投稿時刻だけを渡します。イベント ID や
公開鍵は判定に効かないので送りません（入力トークンの節約）。

## セットアップ

```bash
npm install
cp .env.example .env   # TYPESAFE_API_KEY を書く
export $(grep -v '^#' .env | xargs)
npm start
```

Node.js 22.18 以上が必要です。TypeScript は Node の型ストリッピングでそのまま実行するので、
ビルド手順はありません。

## API

### `GET /timeline`

| パラメータ | 既定値 | 説明 |
| --- | --- | --- |
| `interests` | （なし） | カンマ区切りの興味。指定すると関連度で絞る。未指定なら品質だけで絞る |
| `lang` | （なし） | `ja` `en` などのコード、または `Japanese` のような言語名 |
| `limit` | `20` | 返す ID の数（最大 100） |
| `pool` | `60` | リレーから集める候補数（最大 300）。**そのまま Jev のリクエスト数になる** |
| `lookback` | `21600` | 何秒前までの投稿を対象にするか（最大 7 日） |
| `include_replies` | `0` | `1` で返信も候補に含める |
| `relays` | 環境変数 `NOSTR_RELAYS` | カンマ区切りのリレー URL |
| `min_quality` | `2` | これ未満の品質（0〜4）を落とす |
| `max_spam` | `0.5` | これを超えるスパム確率を落とす |
| `min_relevance` | `0.6` | これ未満の関連度を落とす |
| `verbose` | `0` | `1` で各投稿の判定内容と統計も返す |

```bash
curl 'localhost:8080/timeline?interests=nostr,bitcoin&lang=ja&limit=10'
```

閾値をクエリで変えられるようにしてあるので、チューニングはサーバを再起動せずに
`verbose=1` と見比べながら試せます。

```bash
curl 'localhost:8080/timeline?interests=nostr&verbose=1' | jq '.stats, .posts[0]'
```

```json
{
  "candidates": 60, "assessed": 60, "failed": 0, "selected": 10,
  "elapsedMs": { "fetch": 980, "assess": 4200, "total": 5190 },
  "usage": { "inputTokens": 9400, "outputTokens": 0, "requests": 60 }
}
```

### エラー

| 状況 | 応答 |
| --- | --- |
| クエリが不正 | `400` |
| 候補はあったのに Jev の判定が 1 件も成功しなかった | `502`（API キーが無効なときなど） |
| リレーから 1 件も取れなかった | `200` と `{"ids":[]}`（絞り込んだ結果と区別しない） |

一部の投稿だけ判定に失敗した場合はその投稿を落として続行し、`verbose=1` の `stats.failed`
に件数が出ます。

### `GET /health`

`{"status":"ok"}` を返すだけ。

## コストと所要時間の目安

`pool=60` なら Jev へのリクエストは 60 回。入力は 1 件 150 トークン前後なので、1 リクエスト
あたりの入力は 1 万トークン弱です。Jev の入力単価 $0.042/1M、出力は無料なので、1 回の
`/timeline` は **$0.0005 以下**に収まります。

所要時間は「リレー取得 1 秒前後 + Jev 判定」です。Jev は 1 件 500〜600ms、日本からは
さらに 120ms 程度の地理的遅延が乗るので、`JEV_CONCURRENCY`（既定 8）が実質的な
応答時間を決めます。`pool=60` なら 8 並列で 5 秒前後です。

## 設計上の注意

- **投稿本文は信用できない入力です。** Nostr の投稿には「これまでの指示を無視して…」の
  たぐいが混ざりえます。Jev は自由文を生成せず、用意した選択肢からしか答えないので
  被害の上限は「この投稿の判定が歪む」ことまでで、サーバの挙動は変わりません。
  ただし将来 `choice` の選択肢を増やすときも、この性質は保ったままにしてください。
- **Node 組み込みの WebSocket は使っていません。** nostr-tools は `onerror` の中で
  `close()` を呼びますが、Node 組み込み（undici）の WebSocket はその `close()` から
  再び error を発火させるため、接続できないリレーが 1 つあるだけで
  `onerror → close → onerror` の再帰に入り、スタックオーバーフローでプロセスが落ちます。
  `ws` パッケージの実装に差し替えることで回避しています（`src/nostr.ts`）。
- **リレー接続はプロセスで使い回します。** リクエストごとに張り直すと毎回ハンドシェイクを
  やり直すうえ、接続中に `close()` すると上記の再帰に触れます。
- **問い合わせる前に接続だけ済ませます。** `querySync` は「全リレーが EOSE を返すか閉じたら
  終わり」なので、つながらないリレーが即座に閉じると、まだ接続中の正常なリレーを待たずに
  空の結果で返ってきます。先に `ensureRelay` して、つながったリレーだけを対象にしています。
- Jev は 2026 年 9 月時点で early access です。API キーは
  [console.typesafe.ai](https://console.typesafe.ai/settings/keys) で発行します。

## テスト

```bash
npm test        # node --test
npm run typecheck
```

Jev のテストは SDK の `fetch` 差し替え口に偽サーバを挿して書いてあるので、API キーなしで
実行でき、リクエストの組み立てとレスポンスの読み取りは本物のコードを通ります
（`test/helpers.ts`）。リレー取得も `TimelineDeps` で差し替えられます。
