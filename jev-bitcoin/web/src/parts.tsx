/**
 * The pieces of the screen: an answer, and the close calls.
 *
 * Every answer on this page was written by a person. The model only chose
 * which one; so the card says which prepared question it is answering, and a
 * reader can see whether that is the question they meant.
 */
import { Show } from "@kanabun/core";
import * as api from "./api";
import * as s from "./styles";

/**
 * The tags worth telling a reader about, as the note shown under the answer.
 * The rest (安定, 誤前提, 概念, …) are for whoever maintains the answers: a
 * reader gains nothing from being told their question had a false premise.
 */
const notes: Record<string, string> = {
  時点依存: "時期によって変わる情報です。",
  研究提案: "提案・研究の段階の内容で、いまのBitcoinのルールではありません。",
  実装依存: "ソフトウェアやそのバージョンによって変わります。",
  法域依存: "国や地域によって答えが変わります。",
  要一次確認: "最新の一次資料での確認をおすすめします。",
};

/** Paragraphs as written. Line breaks inside one are kept, so lists survive. */
function Paragraphs(props: { lines: string[] }) {
  return (
    <div class="prose">
      {props.lines.map((line) => (
        <p>{line}</p>
      ))}
    </div>
  );
}

/**
 * One answer.
 *
 * `open` is how a related question is followed: the caller decides whether
 * that means adding it to the conversation or moving to its permalink.
 */
export function AnswerCard(props: { entry: api.Entry; expand?: boolean; open: (id: string) => void }) {
  const e = props.entry;
  const more = e.more ?? [];
  const related = e.related ?? [];
  const sources = e.sources ?? [];
  const cautions = (e.tags ?? []).map((t) => notes[t]).filter((n): n is string => n !== undefined);
  return (
    <div class={s.answer}>
      <p class="meta">
        <span>{e.category.name}</span>
        <a href={`#${e.id}`} title="この答えへのリンク">{`#${e.id}`}</a>
      </p>
      <h3>{e.title}</h3>

      <Show
        when={() => e.answered}
        fallback={<p class="pending">この質問への回答は準備中です。</p>}
      >
        <Paragraphs lines={e.answer} />
      </Show>

      <Show when={() => more.length > 0}>
        <details open={props.expand === true}>
          <summary>もっと詳しく</summary>
          <Paragraphs lines={more} />
        </details>
      </Show>

      <Show when={() => related.length > 0}>
        <div class="related">
          <span class="label">関連する質問</span>
          {related.map((r) => (
            <button type="button" class="chip" onClick={() => props.open(r.id)}>
              {r.title}
            </button>
          ))}
        </div>
      </Show>

      <Show when={() => cautions.length > 0}>
        <ul class="notes">
          {cautions.map((n) => (
            <li>{n}</li>
          ))}
        </ul>
      </Show>

      <Show when={() => sources.length > 0 || e.updated !== undefined}>
        <div class="sources">
          {sources.map((src) =>
            /^https?:\/\//.test(src) ? (
              <a href={src} target="_blank" rel="noopener noreferrer">
                {src}
              </a>
            ) : (
              <span>{src}</span>
            ),
          )}
          <Show when={() => e.updated !== undefined}>
            <span class="updated">{`${e.updated} 時点`}</span>
          </Show>
        </div>
      </Show>
    </div>
  );
}

/** Close calls, each one a button that opens its answer. */
export function Suggestions(props: { items: api.Scored[]; open: (id: string) => void }) {
  return (
    <div class={s.suggestions}>
      <span class="label">もしかして</span>
      {props.items.map((q) => (
        <button type="button" class="chip" onClick={() => props.open(q.id)}>
          {q.title}
        </button>
      ))}
    </div>
  );
}
