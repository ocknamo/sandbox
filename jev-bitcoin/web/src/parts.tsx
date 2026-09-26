/**
 * The pieces of the screen: an answer, the close calls, and the history.
 *
 * Every answer on this page was prepared in advance. The model only chose
 * which one; so the card says which prepared question it is answering, and a
 * reader can see whether that is the question they meant.
 */
import { For, Show } from "@kanabun/core";
import { clear, history } from "./history";
import type { Asked } from "./history";
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
export function Suggestions(props: { label: string; items: api.Scored[]; open: (id: string) => void }) {
  return (
    <div class={s.suggestions}>
      <span class="label">{props.label}</span>
      {props.items.map((q) => (
        <button type="button" class="chip" onClick={() => props.open(q.id)}>
          {q.title}
        </button>
      ))}
    </div>
  );
}

/** What became of an earlier question, in a line. */
function outcome(e: Asked): string {
  if (e.title !== undefined) return `→ ${e.title}`;
  if (e.status === "multiple") return "→ 質問がいくつか入っていました";
  if (e.status === "suggest") return "→ 近い質問がありました";
  return "→ 答えは見つかりませんでした";
}

/** "9/26 14:03", or just the time for today. */
function when(at: number): string {
  const d = new Date(at);
  const hm = `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  return d.toDateString() === new Date().toDateString() ? hm : `${d.getMonth() + 1}/${d.getDate()} ${hm}`;
}

/**
 * What this reader has asked, newest first. Pressing an entry that found an
 * answer reopens it for free; one that did not is asked again. The list lives
 * only in this browser, which the panel says, so nobody wonders whether it is
 * being kept somewhere else.
 */
export function HistoryPanel(props: { again: (q: string, id?: string) => void }) {
  return (
    <Show when={() => history().length > 0}>
      <details class={s.history}>
        <summary>{() => `これまでの質問（${history().length}）`}</summary>
        <ol>
          <For each={history}>
            {(e: Asked) => (
              <li>
                <button type="button" onClick={() => props.again(e.q, e.id)}>
                  <span class="q">{e.q}</span>
                  <span class="a">{outcome(e)}</span>
                </button>
                <span class="at">{when(e.at)}</span>
              </li>
            )}
          </For>
        </ol>
        <p class="foot">
          <span>履歴はこのブラウザの中にだけ保存されています。</span>
          <button type="button" class="clear" onClick={() => clear()}>
            履歴を消す
          </button>
        </p>
      </details>
    </Show>
  );
}
