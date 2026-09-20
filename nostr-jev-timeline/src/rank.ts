import type { Assessment } from "./jev.ts";
import type { Candidate, Criteria, Verdict } from "./types.ts";

/**
 * 採否と並び順を決める。判定そのものは Jev に任せ、ここは閾値と重み付けだけを持つ。
 * 閾値はリクエストのクエリで上書きできるので、チューニングはサーバを再起動せずに試せる。
 */
export function judge(
  candidate: Candidate,
  assessment: Assessment,
  criteria: Criteria,
): Verdict {
  const { spam, quality, relevance, language } = assessment;

  let rejectedFor: string | null = null;
  if (spam > criteria.maxSpam) {
    rejectedFor = "spam";
  } else if (quality < criteria.minQuality) {
    rejectedFor = "quality";
  } else if (relevance !== null && relevance < criteria.minRelevance) {
    rejectedFor = "relevance";
  } else if (language !== null && language < 0.5) {
    rejectedFor = "language";
  }

  // 関連度があるときはそれを主軸にし、品質を従にする。興味の指定がなければ品質だけで並べる。
  const normalizedQuality = quality / 4;
  const rank = relevance !== null
    ? relevance * 0.6 + normalizedQuality * 0.4 - spam * 0.2
    : normalizedQuality - spam * 0.2;

  return { candidate, spam, quality, relevance, language, rank, rejectedFor };
}

/** 採用された投稿だけをスコア順に返す。同点なら新しい投稿を優先する。 */
export function selectTimeline(verdicts: readonly Verdict[], limit: number): Verdict[] {
  return verdicts
    .filter((verdict) => verdict.rejectedFor === null)
    .sort((a, b) =>
      b.rank - a.rank || b.candidate.createdAt - a.candidate.createdAt
    )
    .slice(0, limit);
}
