import { test } from "node:test";
import assert from "node:assert/strict";
import { assess, buildQuestions, buildState } from "../src/jev.ts";
import type { Criteria } from "../src/types.ts";
import { candidate, fakeClient } from "./helpers.ts";

const criteria: Criteria = {
  interests: ["bitcoin", "nostr"],
  language: "Japanese",
  minQuality: 2,
  maxSpam: 0.5,
  minRelevance: 0.6,
};

test("興味と言語の指定があるときだけ該当する質問を出す", () => {
  const withAll = buildQuestions(criteria);
  assert.deepEqual(Object.keys(withAll).sort(), ["language", "quality", "relevance", "spam"]);

  const minimal = buildQuestions({ ...criteria, interests: [], language: null });
  assert.deepEqual(Object.keys(minimal).sort(), ["quality", "spam"]);
});

test("quality のルーブリックは 0 から 4 の 5 段階", () => {
  const questions = buildQuestions(criteria);
  const quality = questions.quality;
  assert.equal(quality?.type, "score");
  assert.equal(quality.type === "score" ? quality.criteria.length : 0, 5);
});

test("state には判定に使う情報だけを入れる", () => {
  const state = buildState(candidate("Nostr のリレー運用の話", { hashtags: ["nostr"], hasMedia: true }));
  assert.deepEqual(Object.keys(state).sort(), ["has_media", "hashtags", "posted_at", "text"]);
  assert.equal(state.text, "Nostr のリレー運用の話");
  assert.equal(state.has_media, true);
  // 判定に効かない識別子は送らない。
  assert.equal("pubkey" in state, false);
  assert.equal("id" in state, false);
});

test("候補ごとに 1 リクエストを投げ、回答を読み取る", async () => {
  const posts = [candidate("Nostr の話"), candidate("宣伝です"), candidate("雑談")];
  const { client, requests } = fakeClient((state) =>
    state.text === "宣伝です"
      ? { spam: 0.95, quality: 1, relevance: 0.2 }
      : { spam: 0.03, quality: 3.5, relevance: 0.8 },
  );

  const result = await assess(client, posts, criteria);

  assert.equal(requests.length, 3);
  assert.equal(result.assessments.size, 3);
  assert.equal(result.failures.length, 0);
  assert.equal(result.usage.requests, 3);
  assert.equal(result.usage.inputTokens, 360);

  const spammy = result.assessments.get(posts[1]!.id);
  assert.equal(spammy?.spam, 0.95);
  assert.equal(spammy?.quality, 1);
  assert.equal(spammy?.relevance, 0.2);
  // language を指定しているので言語の回答も返る。
  assert.equal(typeof spammy?.language, "number");
});

test("個別のリクエストが失敗しても全体は止めず failures に集める", async () => {
  const posts = [candidate("成功する投稿"), candidate("失敗する投稿")];
  const client = new (await import("@typesafe-ai/sdk")).TypeSafeClient({
    apiKey: "test-key",
    retry: { maxRetries: 0 },
    logLevel: "off",
    fetch: async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as { state: { text: string } };
      if (body.state.text === "失敗する投稿") {
        return new Response(JSON.stringify({ error: "boom" }), { status: 500 });
      }
      return new Response(
        JSON.stringify({
          model: "jev-latest",
          answers: {
            spam: { type: "noul", noul: 0.1 },
            quality: { type: "score", score: 3, confidence: 0.9, legend: {}, probabilities: {} },
          },
          usage: { input_tokens: 10, output_tokens: 0 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
  });

  const result = await assess(client, posts, { ...criteria, interests: [], language: null });

  assert.equal(result.assessments.size, 1);
  assert.equal(result.failures.length, 1);
  assert.equal(result.failures[0]?.id, posts[1]!.id);
});
