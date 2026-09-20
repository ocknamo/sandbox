/** リレーから取得して正規化した投稿。Jev に渡すのはこの形。 */
export type Candidate = {
  /** Nostr イベント ID (hex)。API が最終的に返すのはこれだけ。 */
  id: string;
  pubkey: string;
  createdAt: number;
  /** 本文。長文は config.maxContentChars で切り詰めてある。 */
  content: string;
  hashtags: string[];
  isReply: boolean;
  hasMedia: boolean;
};

/** Jev に投げる判定条件。リクエストのクエリから組み立てる。 */
export type Criteria = {
  /** 読者の興味。空なら関連度の質問は出さず、品質だけで絞る。 */
  interests: string[];
  /** 絞り込む言語名 (例: "Japanese")。null なら言語は問わない。 */
  language: string | null;
  /** これ未満の品質スコア (0-4) は落とす。 */
  minQuality: number;
  /** これ以上のスパム確率は落とす。 */
  maxSpam: number;
  /** これ未満の関連度は落とす。interests が空のときは使わない。 */
  minRelevance: number;
};

/** 1 投稿に対する Jev の判定結果。 */
export type Verdict = {
  candidate: Candidate;
  /** スパム / 宣伝 / bot らしさの確率 (0-1)。 */
  spam: number;
  /** 品質スコア (0-4)。中間値を取りうる。 */
  quality: number;
  /** 興味との関連度 (0-1)。interests が空なら null。 */
  relevance: number | null;
  /** 指定言語である確率 (0-1)。language 指定がなければ null。 */
  language: number | null;
  /** 並べ替えに使う総合スコア。 */
  rank: number;
  /** 採用しなかった理由。採用したときは null。 */
  rejectedFor: string | null;
};
