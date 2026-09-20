import { test } from "node:test";
import assert from "node:assert/strict";
import { judge, selectTimeline } from "../src/rank.ts";
import type { Criteria } from "../src/types.ts";
import { candidate } from "./helpers.ts";

const baseCriteria: Criteria = {
  interests: ["nostr"],
  language: null,
  minQuality: 2,
  maxSpam: 0.5,
  minRelevance: 0.6,
};

test("スパム確率が閾値を超えたら落とす", () => {
  const verdict = judge(
    candidate("無料エアドロップはこちら"),
    { spam: 0.92, quality: 3, relevance: 0.9, language: null },
    baseCriteria,
  );
  assert.equal(verdict.rejectedFor, "spam");
});

test("品質が閾値未満なら落とす", () => {
  const verdict = judge(
    candidate("おはよう"),
    { spam: 0.05, quality: 1.2, relevance: 0.9, language: null },
    baseCriteria,
  );
  assert.equal(verdict.rejectedFor, "quality");
});

test("興味と関連しなければ落とす", () => {
  const verdict = judge(
    candidate("今日の昼はラーメンだった"),
    { spam: 0.02, quality: 3, relevance: 0.1, language: null },
    baseCriteria,
  );
  assert.equal(verdict.rejectedFor, "relevance");
});

test("興味を指定していなければ関連度では落とさない", () => {
  const verdict = judge(
    candidate("今日の昼はラーメンだった"),
    { spam: 0.02, quality: 3, relevance: null, language: null },
    { ...baseCriteria, interests: [] },
  );
  assert.equal(verdict.rejectedFor, null);
});

test("採用された投稿だけをスコア順に返す", () => {
  const verdicts = [
    judge(candidate("低め"), { spam: 0.1, quality: 2, relevance: 0.65, language: null }, baseCriteria),
    judge(candidate("高め"), { spam: 0.0, quality: 4, relevance: 0.98, language: null }, baseCriteria),
    judge(candidate("スパム"), { spam: 0.99, quality: 4, relevance: 0.99, language: null }, baseCriteria),
  ];

  const selected = selectTimeline(verdicts, 10);
  assert.deepEqual(selected.map((v) => v.candidate.content), ["高め", "低め"]);
});

test("limit で件数を絞る", () => {
  const verdicts = Array.from({ length: 5 }, (_, i) =>
    judge(candidate(`post ${i}`), { spam: 0, quality: 4, relevance: 0.9, language: null }, baseCriteria),
  );
  assert.equal(selectTimeline(verdicts, 3).length, 3);
});
