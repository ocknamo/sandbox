import { TypeSafeClient } from "@typesafe-ai/sdk";
import type { Candidate } from "../src/types.ts";

export type FakeAnswers = {
  spam: number;
  quality: number;
  relevance?: number;
  language?: number;
};

/**
 * Jev の API を偽装したクライアント。SDK の fetch 差し替え口を使っているので、
 * リクエストの組み立てとレスポンスの読み取りは本物のコードを通る。
 */
export function fakeClient(
  answersFor: (state: { text: string }, questions: Record<string, unknown>) => FakeAnswers,
): { client: TypeSafeClient; requests: unknown[] } {
  const requests: unknown[] = [];

  const client = new TypeSafeClient({
    apiKey: "test-key",
    retry: { maxRetries: 0 },
    fetch: async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as {
        state: { text: string };
        questions: Record<string, unknown>;
      };
      requests.push(body);

      const wanted = answersFor(body.state, body.questions);
      const answers: Record<string, unknown> = {
        spam: { type: "noul", noul: wanted.spam },
        quality: {
          type: "score",
          score: wanted.quality,
          confidence: 0.9,
          legend: {},
          probabilities: {},
        },
      };
      if ("relevance" in body.questions) {
        answers.relevance = { type: "noul", noul: wanted.relevance ?? 0 };
      }
      if ("language" in body.questions) {
        answers.language = { type: "noul", noul: wanted.language ?? 1 };
      }

      return new Response(
        JSON.stringify({
          model: "jev-latest",
          answers,
          usage: { input_tokens: 120, output_tokens: 0 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
  });

  return { client, requests };
}

let counter = 0;

export function candidate(content: string, overrides: Partial<Candidate> = {}): Candidate {
  counter += 1;
  return {
    id: counter.toString(16).padStart(64, "0"),
    pubkey: "f".repeat(64),
    createdAt: 1_760_000_000 + counter,
    content,
    hashtags: [],
    isReply: false,
    hasMedia: false,
    ...overrides,
  };
}
