import { test } from "node:test";
import assert from "node:assert/strict";
import { prefilter, toCandidate } from "../src/nostr.ts";
import { candidate } from "./helpers.ts";

test("イベントを候補に正規化する", () => {
  const event = {
    id: "a".repeat(64),
    pubkey: "b".repeat(64),
    created_at: 1_760_000_000,
    kind: 1,
    tags: [["t", "nostr"], ["e", "c".repeat(64)], ["p", "d".repeat(64)]],
    content: "  リレーの話 https://example.com/photo.jpg  ",
    sig: "",
  };

  const result = toCandidate(event);
  assert.equal(result.content, "リレーの話 https://example.com/photo.jpg");
  assert.deepEqual(result.hashtags, ["nostr"]);
  assert.equal(result.isReply, true);
  assert.equal(result.hasMedia, true);
});

test("既定ではリプライを除外する", () => {
  const posts = [candidate("普通の投稿です"), candidate("返信の投稿です", { isReply: true })];
  assert.equal(prefilter(posts, false).length, 1);
  assert.equal(prefilter(posts, true).length, 2);
});

test("短すぎる投稿と同一本文の連投を落とす", () => {
  const posts = [
    candidate("あ"),
    candidate("同じ本文のコピペ投稿"),
    candidate("同じ本文のコピペ投稿"),
    candidate("  同じ本文のコピペ投稿  ".trim()),
  ];
  const kept = prefilter(posts, false);
  assert.equal(kept.length, 1);
  assert.equal(kept[0]?.content, "同じ本文のコピペ投稿");
});
