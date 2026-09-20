/** 環境変数から読む設定。リクエストごとのパラメータは server.ts 側で扱う。 */

const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://yabu.me",
];

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} は正の整数で指定してください: ${raw}`);
  }
  return parsed;
}

function listFromEnv(name: string, fallback: readonly string[]): readonly string[] {
  const parsed = (process.env[name] ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "");
  return parsed.length > 0 ? parsed : fallback;
}

export const config = {
  port: intFromEnv("PORT", 8080),

  relays: listFromEnv("NOSTR_RELAYS", DEFAULT_RELAYS),

  /** リレーからの取得を諦めるまでの時間 (ms)。 */
  relayMaxWaitMs: intFromEnv("NOSTR_MAX_WAIT_MS", 5000),

  /**
   * リレーへの接続を諦めるまでの時間 (ms)。接続できないリレーが混ざっていると初回リクエストが
   * まるごとこの時間だけ待たされるので、取得の待ち時間とは別に短めにしてある。
   */
  relayConnectTimeoutMs: intFromEnv("NOSTR_CONNECT_TIMEOUT_MS", 3000),

  /** Jev に同時に投げるリクエスト数。1 リクエスト 500〜600ms 前後なので並列数がそのまま応答時間に効く。 */
  jevConcurrency: intFromEnv("JEV_CONCURRENCY", 8),

  /** Jev に渡す本文の最大文字数。長文は先頭だけで十分判断できるうえ、入力トークン課金を抑えられる。 */
  maxContentChars: intFromEnv("JEV_MAX_CONTENT_CHARS", 800),
} as const;

export const defaults = {
  /** レスポンスで返す ID の数。 */
  limit: 20,
  /** リレーから集める候補数の上限。 */
  pool: 60,
  /** 何秒前までの投稿を候補にするか。 */
  lookbackSec: 6 * 60 * 60,
} as const;

export const limits = {
  limit: 100,
  pool: 300,
  lookbackSec: 7 * 24 * 60 * 60,
} as const;
