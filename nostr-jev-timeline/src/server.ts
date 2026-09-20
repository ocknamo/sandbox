import http from "node:http";
import type { TypeSafeClient } from "@typesafe-ai/sdk";
import { config, defaults, limits } from "./config.ts";
import { buildTimeline, type TimelineDeps, type TimelineQuery } from "./timeline.ts";

class BadRequest extends Error {}

/** よく使う言語コードだけ名前に開く。それ以外は書かれたまま Jev に渡す。 */
const LANGUAGE_NAMES: Record<string, string> = {
  ja: "Japanese",
  en: "English",
  ko: "Korean",
  zh: "Chinese",
  es: "Spanish",
  fr: "French",
  de: "German",
  pt: "Portuguese",
  ru: "Russian",
};

function csv(params: URLSearchParams, key: string): string[] {
  return (params.get(key) ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "");
}

function integer(params: URLSearchParams, key: string, fallback: number, max: number): number {
  const raw = params.get(key);
  if (raw === null || raw.trim() === "") return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 1) {
    throw new BadRequest(`${key} は 1 以上の整数で指定してください: ${raw}`);
  }
  if (value > max) {
    throw new BadRequest(`${key} の上限は ${max} です: ${raw}`);
  }
  return value;
}

function ratio(params: URLSearchParams, key: string, fallback: number, max: number): number {
  const raw = params.get(key);
  if (raw === null || raw.trim() === "") return fallback;
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value) || value < 0 || value > max) {
    throw new BadRequest(`${key} は 0 以上 ${max} 以下で指定してください: ${raw}`);
  }
  return value;
}

function flag(params: URLSearchParams, key: string): boolean {
  const raw = params.get(key);
  return raw === "1" || raw === "true";
}

export function parseQuery(params: URLSearchParams): TimelineQuery {
  const relays = csv(params, "relays");
  for (const relay of relays) {
    if (!relay.startsWith("wss://") && !relay.startsWith("ws://")) {
      throw new BadRequest(`relays には ws:// または wss:// の URL を指定してください: ${relay}`);
    }
  }

  const lang = params.get("lang")?.trim() ?? "";
  const language = lang === "" ? null : (LANGUAGE_NAMES[lang.toLowerCase()] ?? lang);

  return {
    interests: csv(params, "interests"),
    language,
    limit: integer(params, "limit", defaults.limit, limits.limit),
    pool: integer(params, "pool", defaults.pool, limits.pool),
    lookbackSec: integer(params, "lookback", defaults.lookbackSec, limits.lookbackSec),
    includeReplies: flag(params, "include_replies"),
    relays: relays.length > 0 ? relays : config.relays,
    minQuality: ratio(params, "min_quality", 2, 4),
    maxSpam: ratio(params, "max_spam", 0.5, 1),
    minRelevance: ratio(params, "min_relevance", 0.6, 1),
  };
}

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

export function createServer(client: TypeSafeClient, deps?: TimelineDeps): http.Server {
  return http.createServer((req, res) => {
    void handle(client, req, res, deps).catch((error: unknown) => {
      if (res.headersSent) {
        res.destroy();
        return;
      }
      if (error instanceof BadRequest) {
        sendJson(res, 400, { error: error.message });
        return;
      }
      console.error("[timeline] 失敗:", error);
      const message = error instanceof Error ? error.message : String(error);
      sendJson(res, 502, { error: "タイムラインを生成できませんでした", detail: message });
    });
  });
}

async function handle(
  client: TypeSafeClient,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  deps?: TimelineDeps,
): Promise<void> {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  if (req.method !== "GET") {
    sendJson(res, 405, { error: "GET のみ受け付けます" });
    return;
  }

  if (url.pathname === "/health") {
    sendJson(res, 200, { status: "ok" });
    return;
  }

  if (url.pathname !== "/timeline") {
    sendJson(res, 404, { error: "not found", routes: ["/timeline", "/health"] });
    return;
  }

  const query = parseQuery(url.searchParams);

  // クライアントが切ったら Jev への残りのリクエストも止める。
  const controller = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) controller.abort();
  });

  const result = await buildTimeline(client, query, controller.signal, deps);

  // 候補はあったのに 1 件も判定できなかったのは、こちらの絞り込みの結果ではなく上流の障害
  // （API キーが無効、Jev が落ちている等）。空配列で 200 を返すと区別がつかないので分ける。
  if (result.stats.candidates > 0 && result.stats.assessed === 0) {
    sendJson(res, 502, {
      error: "Jev への判定リクエストがすべて失敗しました",
      detail: result.failures[0]?.message ?? "原因不明",
      candidates: result.stats.candidates,
    });
    return;
  }

  if (!flag(url.searchParams, "verbose")) {
    sendJson(res, 200, { ids: result.ids });
    return;
  }

  sendJson(res, 200, {
    ids: result.ids,
    stats: result.stats,
    posts: result.verdicts
      .slice()
      .sort((a, b) => b.rank - a.rank)
      .map((verdict) => ({
        id: verdict.candidate.id,
        content: verdict.candidate.content.slice(0, 120),
        spam: verdict.spam,
        quality: verdict.quality,
        relevance: verdict.relevance,
        language: verdict.language,
        rank: Number(verdict.rank.toFixed(4)),
        rejected_for: verdict.rejectedFor,
      })),
  });
}
