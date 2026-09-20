import type { TypeSafeClient } from "@typesafe-ai/sdk";
import { assess, type AssessmentFailure } from "./jev.ts";
import { fetchCandidates } from "./nostr.ts";
import { judge, selectTimeline } from "./rank.ts";
import type { Candidate, Criteria, Verdict } from "./types.ts";

export type TimelineQuery = Criteria & {
  relays: readonly string[];
  limit: number;
  pool: number;
  lookbackSec: number;
  includeReplies: boolean;
};

export type TimelineStats = {
  /** リレーから取れて足切りを通った候補数。 */
  candidates: number;
  /** Jev が判定できた数。 */
  assessed: number;
  /** 判定に失敗した数（タイムアウトなど）。 */
  failed: number;
  selected: number;
  elapsedMs: { fetch: number; assess: number; total: number };
  usage: { inputTokens: number; outputTokens: number; requests: number };
};

export type TimelineResult = {
  ids: string[];
  verdicts: Verdict[];
  /** 判定できなかった投稿とその理由。全滅したかどうかの判断に使う。 */
  failures: AssessmentFailure[];
  stats: TimelineStats;
};

/** テストからリレー取得を差し替えるための口。 */
export type TimelineDeps = {
  fetchCandidates: (options: {
    relays: readonly string[];
    pool: number;
    lookbackSec: number;
    includeReplies: boolean;
  }) => Promise<Candidate[]>;
};

const defaultDeps: TimelineDeps = { fetchCandidates };

export async function buildTimeline(
  client: TypeSafeClient,
  query: TimelineQuery,
  signal?: AbortSignal,
  deps: TimelineDeps = defaultDeps,
): Promise<TimelineResult> {
  const startedAt = Date.now();

  const candidates = await deps.fetchCandidates({
    relays: query.relays,
    pool: query.pool,
    lookbackSec: query.lookbackSec,
    includeReplies: query.includeReplies,
  });
  const fetchedAt = Date.now();

  const criteria: Criteria = {
    interests: query.interests,
    language: query.language,
    minQuality: query.minQuality,
    maxSpam: query.maxSpam,
    minRelevance: query.minRelevance,
  };

  const { assessments, failures, usage } = await assess(client, candidates, criteria, signal);
  const assessedAt = Date.now();

  const verdicts = candidates.flatMap((candidate) => {
    const assessment = assessments.get(candidate.id);
    return assessment === undefined ? [] : [judge(candidate, assessment, criteria)];
  });
  const selected = selectTimeline(verdicts, query.limit);

  return {
    ids: selected.map((verdict) => verdict.candidate.id),
    verdicts,
    failures,
    stats: {
      candidates: candidates.length,
      assessed: assessments.size,
      failed: failures.length,
      selected: selected.length,
      elapsedMs: {
        fetch: fetchedAt - startedAt,
        assess: assessedAt - fetchedAt,
        total: Date.now() - startedAt,
      },
      usage,
    },
  };
}
