# go-cloudrun-bird

リクエストするとランダムに鳥の画像を返す HTTP API です。[Dog API](https://dog.ceo/dog-api/)
の鳥版で、レスポンスの形（`status` と `message`）を揃えてあります。

画像そのものはリポジトリに持たず、[Wikimedia Commons](https://commons.wikimedia.org/)
から実行時に取得します。バイナリに埋め込んであるのは「どの鳥の画像がどのカテゴリに
あるか」という一覧（[`internal/catalog/birds.json`](internal/catalog/birds.json)、
23 グループ / 47 種）だけです。画像 URL を直接埋め込まないので、ファイルが改名・削除
されてもリンク切れになりません。

## エンドポイント

| メソッド | パス | 内容 |
| --- | --- | --- |
| GET | `/health` | `{"status":"ok"}` |
| GET | `/api/birds/image/random` | ランダムな画像 1 枚 |
| GET | `/api/birds/image/random/{count}` | ランダムな画像を最大 50 枚 |
| GET | `/api/birds/image/redirect` | ランダムな画像へ 302 リダイレクト |
| GET | `/api/birds/list/all` | グループ → 種 の一覧（Dog API の breed / sub-breed 相当） |
| GET | `/api/birds/catalog` | 和名・英名・学名つきの一覧 |
| GET | `/api/bird/{group}/images/random` | そのグループからランダムに 1 枚 |
| GET | `/api/bird/{group}/images/random/{count}` | そのグループからランダムに複数枚 |
| GET | `/api/bird/{group}/images/redirect` | そのグループからランダムな画像へリダイレクト |
| GET | `/api/bird/{group}/images` | そのグループの画像をすべて |
| GET | `/api/bird/{group}/{species}/images/...` | 上記と同じものを種単位で |
| GET | `/index.html` | フロントエンド（GitHub Pages）へ 302 リダイレクト。`/` も同じ |

動作確認用のページは **https://ocknamo.github.io/sandbox/** にあります。
`/index.html` と `/` はそこへリダイレクトします。

`{group}` は `owl` や `penguin` のような大まかな分類、`{species}` はその中の種
（`barn-owl` など）です。Dog API の breed / sub-breed と同じ関係で、大文字小文字は
区別しません。

```console
$ curl "$URL/api/birds/image/random"
{
  "status": "success",
  "message": "https://upload.wikimedia.org/wikipedia/commons/6/66/Eurasian_Jay_....jpg",
  "bird": {
    "group": "crow",
    "species": "eurasian-jay",
    "name_en": "Eurasian jay",
    "name_ja": "カケス",
    "scientific_name": "Garrulus glandarius"
  },
  "attribution": {
    "title": "File:Eurasian Jay ....jpg",
    "artist": "Shiv's fotografia",
    "license": "CC BY-SA 4.0",
    "license_url": "https://creativecommons.org/licenses/by-sa/4.0",
    "source_page": "https://commons.wikimedia.org/wiki/File:Eurasian_Jay_....jpg",
    "width": 5568,
    "height": 3712
  }
}
```

`message` は Dog API と同じく画像 URL そのもの（複数枚のときは URL の配列）です。
`bird` と `attribution` はこの API の追加分になります。

エラーも Dog API に合わせています。

```console
$ curl "$URL/api/bird/velociraptor/images/random"
{ "status": "error", "message": "group \"velociraptor\" not found (see /api/birds/list/all)", "code": 404 }
```

`<img>` から直接使いたい場合はリダイレクトのエンドポイントが使えます。

```html
<img src="https://.../api/bird/owl/images/redirect" alt="ランダムなフクロウ">
```

## フロントエンド

[`docs/index.html`](../docs/index.html) の 1 ファイルのみ（ビルド不要）。
GitHub Pages だけが配信し、この API 自体はページを持ちません
（`/index.html` は Pages へリダイレクトします）。

ページは `docs/index.html` 内 `DEPLOYED_API`（Cloud Run の URL）を CORS 越しに
呼びます。`?api=` で向き先を差し替え可能（例:
`?api=http://localhost:8080` でローカルの `go run .` に向ける）。

## ライセンスとクレジット

Commons の画像は自由に使えますが、多くは CC BY / CC BY-SA でクレジットの表示が
必要です。そのため単なる URL ではなく、作者・ライセンス・ファイルページを
`attribution` として必ず返しています。表示する側でこれを使ってください。パブリック
ドメインの画像の場合は `license` が `Public domain` になります。

取り込む対象は写真だけに絞ってあります。カテゴリには鳴き声の音声ファイルや分布図、
小さすぎる画像も含まれるため、`mediatype` が `BITMAP`、MIME が JPEG / PNG / WebP、
800×600 以上、20 MB 以下のものだけを使います。

## Commons へのアクセス

- 画像一覧は種ごとにキャッシュします（既定 12 時間）。同じ種へのリクエストが
  同時に来ても、上流への問い合わせは 1 回にまとまります。
- 更新に失敗したときは、古いキャッシュをそのまま返します。エラーを返すより
  少し古い画像を返す方がましなためです。
- 起動時にバックグラウンドで数種だけ先読みします。リッスン開始はブロックしません。
- User-Agent は Wikimedia の
  [User-Agent ポリシー](https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_User-Agent_Policy)
  に従って名乗ります。なお `go-` で始まる User-Agent は Wikimedia 側で 403 に
  なるため（`Go-http-client` 対策）、既定値は `bird-api/...` にしてあります。

### 環境変数

| 変数 | 既定値 | 内容 |
| --- | --- | --- |
| `PORT` | `8080` | Cloud Run が注入 |
| `BIRD_CACHE_TTL` | `12h` | 画像一覧の再取得間隔 |
| `BIRD_PREWARM_COUNT` | `6` | 起動時に先読みする種の数（`0` で無効） |
| `BIRD_USER_AGENT` | `bird-api/1.0 (+https://github.com/ocknamo/sandbox)` | Commons へ送る User-Agent |
| `BIRD_COMMONS_ENDPOINT` | Commons の `api.php` | 差し替え用（テストやミラー） |
| `BIRD_FRONTEND_URL` | `https://ocknamo.github.io/sandbox/` | `/index.html` のリダイレクト先 |

## 鳥を増やすには

[`internal/catalog/birds.json`](internal/catalog/birds.json) に追記するだけです。
`commons_category` には実在する Commons のカテゴリ（多くは学名）を指定してください。

```console
$ curl "https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=Category:Bubo%20bubo"
```

## ローカルでの実行

```sh
go test ./...
go run .                       # http://localhost:8080/api/birds/image/random

docker build -t go-cloudrun-bird .
docker run --rm -p 8080:8080 go-cloudrun-bird
```

テストはすべて `httptest` の偽 Commons に対して動くため、ネットワークには
アクセスしません。

## デプロイ

API は `.github/workflows/deploy-go-cloudrun-bird.yml` が共通の `deploy-service.yml`
を呼び出します。既存のプロジェクト・Workload Identity・サービスアカウントを
そのまま使うため、GCP 側の追加作業はありません。

フロントエンドにデプロイはありません。GitHub Pages が `docs/` をそのまま配信する
ため、`docs/index.html` への push がそのまま公開になります。
