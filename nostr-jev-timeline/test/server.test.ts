import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createServer, parseQuery } from "../src/server.ts";
import type { TimelineDeps } from "../src/timeline.ts";
import { candidate, fakeClient } from "./helpers.ts";

const posts = [
  candidate("Nostr のリレー運用でハマった話を書いた"),
  candidate("無料エアドロップ！今すぐクリック"),
  candidate("昼に食べたラーメンが美味しかった"),
];

const deps: TimelineDeps = { fetchCandidates: async () => posts };

/** 本文から判定を決め打ちする偽 Jev。 */
const answersFor = (state: { text: string }) => {
  if (state.text.includes("エアドロップ")) return { spam: 0.97, quality: 0.5, relevance: 0.3 };
  if (state.text.includes("Nostr")) return { spam: 0.02, quality: 4, relevance: 0.95 };
  return { spam: 0.05, quality: 2.5, relevance: 0.1 };
};

async function withServer<T>(run: (baseUrl: string) => Promise<T>): Promise<T> {
  const { client } = fakeClient(answersFor);
  const server = createServer(client, deps);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  try {
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

test("GET /timeline は投稿 ID だけを返す", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/timeline?interests=nostr`);
    assert.equal(res.status, 200);

    const body = (await res.json()) as Record<string, unknown>;
    assert.deepEqual(Object.keys(body), ["ids"]);
    // スパムと興味に合わない投稿は落ちる。
    assert.deepEqual(body.ids, [posts[0]!.id]);
  });
});

test("興味を指定しなければ品質だけで絞る", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/timeline`);
    const body = (await res.json()) as { ids: string[] };
    // スパムだけが落ち、ラーメンの投稿は品質 2.5 なので残る。
    assert.deepEqual(body.ids, [posts[0]!.id, posts[2]!.id]);
  });
});

test("verbose=1 で各投稿の判定内容を返す", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/timeline?interests=nostr&verbose=1`);
    const body = (await res.json()) as {
      ids: string[];
      stats: { candidates: number; assessed: number; failed: number };
      posts: { id: string; rejected_for: string | null }[];
    };

    assert.equal(body.stats.candidates, 3);
    assert.equal(body.stats.assessed, 3);
    assert.equal(body.stats.failed, 0);
    assert.equal(body.posts.length, 3);
    assert.equal(body.posts.find((p) => p.id === posts[1]!.id)?.rejected_for, "spam");
  });
});

test("不正なクエリは 400 を返す", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/timeline?limit=0`);
    assert.equal(res.status, 400);
    const body = (await res.json()) as { error: string };
    assert.match(body.error, /limit/);
  });
});

test("/health と未知のパス", async () => {
  await withServer(async (baseUrl) => {
    assert.equal((await fetch(`${baseUrl}/health`)).status, 200);
    assert.equal((await fetch(`${baseUrl}/nope`)).status, 404);
    assert.equal((await fetch(`${baseUrl}/timeline`, { method: "POST" })).status, 405);
  });
});

test("クエリの解釈", () => {
  const query = parseQuery(new URLSearchParams("interests=nostr,%20bitcoin&lang=ja&limit=5&max_spam=0.2"));
  assert.deepEqual(query.interests, ["nostr", "bitcoin"]);
  assert.equal(query.language, "Japanese");
  assert.equal(query.limit, 5);
  assert.equal(query.maxSpam, 0.2);
  assert.equal(query.includeReplies, false);
});

test("上限を超える limit と不正なリレー URL は弾く", () => {
  assert.throws(() => parseQuery(new URLSearchParams("limit=500")), /limit/);
  assert.throws(() => parseQuery(new URLSearchParams("relays=http://example.com")), /relays/);
  assert.throws(() => parseQuery(new URLSearchParams("max_spam=2")), /max_spam/);
});

test("Jev の判定が全滅したら 502 を返す", async () => {
  const { TypeSafeClient } = await import("@typesafe-ai/sdk");
  const client = new TypeSafeClient({
    apiKey: "bad-key",
    retry: { maxRetries: 0 },
    logLevel: "off",
    fetch: async () => new Response(JSON.stringify({ error: "invalid api key" }), { status: 401 }),
  });

  const server = createServer(client, deps);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  try {
    const res = await fetch(`http://127.0.0.1:${port}/timeline`);
    assert.equal(res.status, 502);
    const body = (await res.json()) as { error: string; candidates: number };
    assert.match(body.error, /Jev/);
    assert.equal(body.candidates, 3);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
