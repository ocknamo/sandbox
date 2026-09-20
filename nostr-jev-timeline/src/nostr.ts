import { SimplePool, useWebSocketImplementation } from "nostr-tools/pool";
import type { Event, Filter } from "nostr-tools";
import WebSocket from "ws";
import { config } from "./config.ts";
import type { Candidate } from "./types.ts";

/**
 * WebSocket の実装まわりで、リレーが 1 つ落ちているだけでプロセスが死ぬ経路が 2 つあるので
 * どちらも塞いでおく。
 *
 * 1. Node 組み込み (undici) の WebSocket は使わない。nostr-tools は `onerror` の中で
 *    `close()` を呼ぶが、undici はその `close()` から再び error を発火させるため、
 *    `onerror -> close -> onerror` の再帰でスタックオーバーフローになる。
 * 2. `ws` パッケージは、リスナのない `error` イベントを EventEmitter の規約どおり throw する。
 *    nostr-tools は接続を諦めるときに `onerror` を null に戻すので、その後に届いたエラー
 *    （接続確立前の close など）を拾う相手がいなくなる。常に握りつぶすリスナを 1 つ足しておく。
 */
class RelayWebSocket extends WebSocket {
  constructor(url: string | URL, protocols?: string | string[]) {
    super(url, protocols);
    this.on("error", () => {});
  }
}

useWebSocketImplementation(RelayWebSocket);

const MEDIA_URL = /https?:\/\/\S+\.(?:jpe?g|png|gif|webp|mp4|webm|mov)\b/i;
/**
 * 本文がこれより短い投稿は Jev に渡す前に落とす。日本語は 1 文字あたりの情報量が多いので
 * ここは「空同然の投稿」を弾くだけにとどめ、内容の良し悪しの判断は Jev の quality に任せる。
 */
const MIN_CONTENT_CHARS = 4;

export type FetchOptions = {
  relays: readonly string[];
  /** 何件まで集めるか。 */
  pool: number;
  /** 何秒前までを対象にするか。 */
  lookbackSec: number;
  /** リプライを含めるか。既定は false（タイムライン用途では返信は雑音になりやすい）。 */
  includeReplies: boolean;
};

/** イベントを候補に正規化する。判定に使わない情報はここで捨てる。 */
export function toCandidate(event: Event): Candidate {
  const hashtags = event.tags
    .filter((tag) => tag[0] === "t" && typeof tag[1] === "string")
    .map((tag) => tag[1] as string);

  return {
    id: event.id,
    pubkey: event.pubkey,
    createdAt: event.created_at,
    content: event.content.trim().slice(0, config.maxContentChars),
    hashtags,
    isReply: event.tags.some((tag) => tag[0] === "e"),
    hasMedia: MEDIA_URL.test(event.content),
  };
}

/**
 * Jev に渡す前の足切り。ここで落とせるものはモデルに聞かない方が速くて安い。
 * 同じ本文の連投（コピペ spam）は最初の 1 件だけ残す。
 */
export function prefilter(candidates: Candidate[], includeReplies: boolean): Candidate[] {
  const seenContent = new Set<string>();
  const kept: Candidate[] = [];

  for (const candidate of candidates) {
    if (!includeReplies && candidate.isReply) continue;
    if (candidate.content.length < MIN_CONTENT_CHARS) continue;

    const fingerprint = candidate.content.replace(/\s+/g, " ").toLowerCase();
    if (seenContent.has(fingerprint)) continue;
    seenContent.add(fingerprint);

    kept.push(candidate);
  }

  return kept;
}

/**
 * リレーへの接続はプロセス全体で使い回す。リクエストごとに張り直すと毎回ハンドシェイクを
 * やり直すことになるうえ、接続中に close するとその WebSocket のエラーが誰も待っていない
 * Promise を reject し、unhandledRejection でプロセスごと落ちる。
 */
let sharedPool: SimplePool | null = null;
const knownRelays = new Set<string>();

function getPool(): SimplePool {
  sharedPool ??= new SimplePool();
  return sharedPool;
}

/** プロセス終了時に接続を畳む。 */
export function closePool(): void {
  sharedPool?.close([...knownRelays]);
  sharedPool = null;
  knownRelays.clear();
}

/**
 * 先に接続だけ済ませ、つながったリレーだけを問い合わせ対象にする。
 * querySync は「全リレーが EOSE を返すか閉じたら終わり」なので、接続できないリレーが
 * 即座に閉じると、まだ接続中の正常なリレーを待たずに空の結果で返ってきてしまう。
 */
async function connectedRelays(pool: SimplePool, relays: readonly string[]): Promise<string[]> {
  const settled = await Promise.all(
    relays.map(async (url) => {
      try {
        await pool.ensureRelay(url, { connectionTimeout: config.relayConnectTimeoutMs });
        return url;
      } catch {
        return null;
      }
    }),
  );
  return settled.filter((url): url is string => url !== null);
}

/** リレーから最近の kind:1 を集め、候補として返す。新しい順。 */
export async function fetchCandidates(options: FetchOptions): Promise<Candidate[]> {
  const pool = getPool();
  for (const relay of options.relays) knownRelays.add(relay);

  const relays = await connectedRelays(pool, options.relays);
  if (relays.length === 0) return [];

  const filter: Filter = {
    kinds: [1],
    since: Math.floor(Date.now() / 1000) - options.lookbackSec,
    // 足切りで減る分を見込んで多めに引く。
    limit: Math.min(options.pool * 3, 500),
  };

  const events = await pool.querySync(relays, filter, { maxWait: config.relayMaxWaitMs });
  const candidates = events
    .map(toCandidate)
    .sort((a, b) => b.createdAt - a.createdAt);
  return prefilter(candidates, options.includeReplies).slice(0, options.pool);
}
