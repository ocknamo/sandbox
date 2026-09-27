/**
 * Taking a question and its answer off the page, to post somewhere.
 *
 * The post is the reader's own question and the start of the answer, with a
 * link to the whole of it. The link is the answer's number (`#1-7`), which
 * opens it by looking it up rather than by asking the model, so everybody
 * who follows it costs nothing.
 *
 * What will be posted is shown before it is: the question is whatever the
 * reader typed, and they should see it the way their followers will.
 */
import { signal } from "@kanabun/core";
import type * as api from "./api";
import * as st from "./styles";

/**
 * How much of each half to keep. A post on X counts a kanji or kana as two of
 * its 280 and a link as 23, so 50 + 60 characters of Japanese, the tag and
 * the link stay inside one post with room to spare.
 */
const QUESTION_CHARS = 50;
const ANSWER_CHARS = 60;

const TAG = "#jevbitcoin";

/** At most `n` characters (not UTF-16 units), with an ellipsis if cut. */
function clip(text: string, n: number): string {
  const chars = [...text.replace(/\s+/g, " ").trim()];
  return chars.length <= n ? chars.join("") : `${chars.slice(0, n - 1).join("")}…`;
}

/**
 * The answer's opening, as far as its first sentence if that fits. A
 * sentence cut in half reads worse than a shorter whole one.
 */
function lead(e: api.Entry): string {
  const first = (e.answer[0] ?? "").replace(/\s+/g, " ").trim();
  const end = first.indexOf("。");
  if (end >= 0 && [...first.slice(0, end + 1)].length <= ANSWER_CHARS) return first.slice(0, end + 1);
  return clip(first, ANSWER_CHARS);
}

export function shareText(question: string, e: api.Entry): string {
  return [`Q. ${clip(question, QUESTION_CHARS)}`, `A. ${lead(e)}`, TAG].join("\n");
}

/**
 * The link to this answer, without `?api=`: that points the page at a
 * service somebody was testing against, and a friend following the link
 * wants the real one.
 */
export function shareURL(id: string): string {
  const url = new URL(location.href);
  url.searchParams.delete("api");
  url.hash = id;
  return url.toString();
}

/**
 * Two ways out: the device's own share sheet where there is one, and a
 * plain copy to the clipboard, which works everywhere and is what a desktop
 * browser is left with.
 */
export function Share(props: { question: string; entry: api.Entry }) {
  const text = shareText(props.question, props.entry);
  const url = shareURL(props.entry.id);
  const copied = signal(false);
  const canShare = typeof navigator.share === "function";

  const share = () => {
    navigator.share({ title: props.entry.title, text, url }).catch(() => {
      // Closing the share sheet rejects, and that is not an error to report.
    });
  };

  const copy = async () => {
    const all = `${text}\n${url}`;
    try {
      await navigator.clipboard.writeText(all);
    } catch {
      // No clipboard API (an insecure origin, an old browser): the textarea
      // route still works nearly everywhere.
      const area = document.createElement("textarea");
      area.value = all;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    copied.set(true);
    setTimeout(() => copied.set(false), 2000);
  };

  return (
    <details class={st.share}>
      <summary>この質問と答えを共有する</summary>
      <pre>{`${text}\n${url}`}</pre>
      <div class="buttons">
        {canShare ? (
          <button type="button" onClick={share}>
            共有する
          </button>
        ) : null}
        <button type="button" onClick={() => void copy()}>
          {() => (copied() ? "コピーしました" : "コピー")}
        </button>
      </div>
    </details>
  );
}
