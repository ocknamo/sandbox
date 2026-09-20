import { TypeSafeClient, noul, score } from "@typesafe-ai/sdk";
import type { JsonValue, Questions, SystemOneResult } from "@typesafe-ai/sdk";
import { config } from "./config.ts";
import type { Candidate, Criteria } from "./types.ts";

/**
 * 1 投稿につき 1 リクエスト。1 リクエストの中で複数の観点を同時に判定させる形にしてある
 * （Jev は 1 リクエストで並列に判定できるのが速さの理由なので、観点を分けて投げ直さない）。
 */
export type Assessment = {
  spam: number;
  quality: number;
  relevance: number | null;
  language: number | null;
};

export type AssessmentFailure = {
  id: string;
  message: string;
};

export type AssessBatchResult = {
  assessments: Map<string, Assessment>;
  failures: AssessmentFailure[];
  usage: { inputTokens: number; outputTokens: number; requests: number };
};

const QUALITY_RUBRIC = [
  "Noise: greetings, single emoji, test posts, or content-free chatter.",
  "Low: a personal one-liner that means little to anyone outside the author's circle.",
  "Fair: a clear opinion, question, or observation that a stranger could follow.",
  "Good: substantive commentary, a concrete report, or information a reader could act on.",
  "Excellent: original insight, careful analysis, or a genuinely useful resource.",
] as const;

/** 投稿を Jev に渡す形に整える。判定に効かないフィールドは送らない（入力トークンの節約）。 */
export function buildState(candidate: Candidate): Record<string, JsonValue> {
  return {
    text: candidate.content,
    hashtags: candidate.hashtags,
    has_media: candidate.hasMedia,
    posted_at: new Date(candidate.createdAt * 1000).toISOString(),
  };
}

/** 判定条件から質問を組み立てる。関連度と言語は指定があるときだけ聞く。 */
export function buildQuestions(criteria: Criteria): Questions {
  const questions: Questions = {
    spam: noul(
      "Is this post spam, a scam, an airdrop or giveaway farm, an unsolicited advertisement, or mechanical bot output?",
      {
        true: "Promotional, deceptive, engagement-farming, or machine-generated filler.",
        false: "A genuine post written by a person for other people to read.",
      },
    ),
    quality: score(
      "How much is this post worth reading for someone scrolling a public timeline who does not follow the author?",
      QUALITY_RUBRIC,
    ),
  };

  if (criteria.interests.length > 0) {
    questions.relevance = noul(
      {
        question: "Does this post match the reader's interests?",
        reader_interests: criteria.interests,
        note: "Judge the subject matter of the post, not its popularity or tone.",
      },
      {
        true: "The post is about one or more of the listed interests.",
        false: "The post is about something else.",
      },
    );
  }

  if (criteria.language !== null) {
    questions.language = noul(
      `Is the body of this post written mainly in ${criteria.language}?`,
    );
  }

  return questions;
}

/** 回答の取り出し。質問を出していない観点は null になる。 */
function readNoul(result: SystemOneResult<Questions>, key: string): number | null {
  const answer = result.answers[key];
  return answer !== undefined && answer.type === "noul" ? answer.noul : null;
}

function readScore(result: SystemOneResult<Questions>, key: string): number | null {
  const answer = result.answers[key];
  return answer !== undefined && answer.type === "score" ? answer.score : null;
}

export function toAssessment(result: SystemOneResult<Questions>): Assessment {
  const spam = readNoul(result, "spam");
  const quality = readScore(result, "quality");
  if (spam === null || quality === null) {
    throw new Error("Jev のレスポンスに spam / quality の回答が含まれていません");
  }

  return {
    spam,
    quality,
    relevance: readNoul(result, "relevance"),
    language: readNoul(result, "language"),
  };
}

/** 並列数を絞って実行する。Jev 自体は速いが、レート制限と応答時間の予測可能性のため。 */
async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = next++;
      const item = items[index];
      if (item === undefined) return;
      results[index] = await worker(item);
    }
  });

  await Promise.all(runners);
  return results;
}

/** 候補をまとめて判定する。個別の失敗は例外にせず failures に集める。 */
export async function assess(
  client: TypeSafeClient,
  candidates: readonly Candidate[],
  criteria: Criteria,
  signal?: AbortSignal,
): Promise<AssessBatchResult> {
  const questions = buildQuestions(criteria);
  const assessments = new Map<string, Assessment>();
  const failures: AssessmentFailure[] = [];
  const usage = { inputTokens: 0, outputTokens: 0, requests: 0 };

  await mapWithConcurrency(candidates, config.jevConcurrency, async (candidate) => {
    try {
      const result = await client.systemOne(
        { state: buildState(candidate), questions },
        { signal },
      );
      usage.inputTokens += result.usage.input_tokens;
      usage.outputTokens += result.usage.output_tokens;
      usage.requests += 1;
      assessments.set(candidate.id, toAssessment(result));
    } catch (error) {
      failures.push({
        id: candidate.id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return { assessments, failures, usage };
}
