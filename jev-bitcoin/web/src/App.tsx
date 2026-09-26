/**
 * The whole page: the owl, one field, and the answer.
 *
 * There is no submit button. Once the field holds five characters or more and
 * the typing pauses for half a second, what is there is asked. That makes the
 * reply feel immediate, and it means a reader who keeps typing is asked about
 * again, so three rules keep it honest:
 *
 *   - nothing is sent while an IME is composing: unconverted kana is not a
 *     question yet, and Japanese is typed through one;
 *   - the same text is never sent twice in a row;
 *   - only the latest question's reply is shown. An earlier reply that
 *     arrives late is dropped rather than overwriting a newer one.
 *
 * Enter still asks at once, for anybody who expects it to.
 *
 * `#1-7` shows that question's answer, which is what the link on an answer
 * points at. Looking an answer up by its number never calls the model.
 *
 * What the reader asked is kept in their own browser (see history.ts) and
 * listed under the answer, so they can go back to an earlier one.
 */
import { Show, effect, onCleanup, signal } from "@kanabun/core";
import * as api from "./api";
import { Owl } from "./Owl";
import type { Mood } from "./Owl";
import { AnswerCard, HistoryPanel, Suggestions } from "./parts";
import { record, resolveLatest } from "./history";
import * as s from "./styles";

/** How long the typing has to pause before the field is asked. */
const PAUSE_MS = 500;
/** How many characters the field needs before it is asked by itself. */
const MIN_CHARS = 5;

/** Characters, not UTF-16 units: "₿" and most kanji are one each either way. */
const length = (text: string) => [...text].length;

/** The differences that do not change a question. */
const normalise = (text: string) => text.trim().replace(/\s+/g, " ");

const idPattern = /^[1-9][0-9]*-[1-9][0-9]*$/;

export function App() {
  const draft = signal("");
  const reply = signal<api.Answer | null>(null);
  const busy = signal(false);
  const error = signal("");

  let timer: ReturnType<typeof setTimeout> | undefined;
  let composing = false;
  let lastAsked = "";
  // Every request takes a number; a reply is shown only if its number is
  // still the latest when it arrives.
  let latest = 0;

  const mood = (): Mood => {
    if (busy()) return "thinking";
    const r = reply();
    if (r === null) return error() === "" ? "idle" : "miss";
    return r.status;
  };

  const run = async (work: () => Promise<api.Answer>, then?: (r: api.Answer) => void) => {
    const mine = ++latest;
    busy.set(true);
    error.set("");
    try {
      const r = await work();
      if (mine === latest) {
        reply.set(r);
        then?.(r);
      }
    } catch (err) {
      if (mine === latest) error.set(err instanceof Error ? err.message : String(err));
    } finally {
      if (mine === latest) busy.set(false);
    }
  };

  const ask = (text: string) => {
    const q = normalise(text);
    if (length(q) < MIN_CHARS || q === lastAsked) return;
    lastAsked = q;
    void run(
      () => api.ask(q),
      (r) => record(q, r.status, r.answer?.id, r.answer?.title),
    );
  };

  const schedule = () => {
    clearTimeout(timer);
    if (composing) return;
    const text = draft.peek();
    if (length(normalise(text)) >= MIN_CHARS) timer = setTimeout(() => ask(text), PAUSE_MS);
  };

  /**
   * A question opened by its number: a suggestion, a related link, `#1-7`,
   * the history. `pick` marks the reader choosing among suggestions, which
   * is what the question they just asked turned out to mean.
   */
  const show = (id: string, pick: boolean) => {
    clearTimeout(timer);
    void run(
      async () => {
        const entry = await api.entry(id);
        return { status: "answer", answer: entry, categories: [] } satisfies api.Answer;
      },
      (r) => {
        if (pick && r.answer !== undefined) resolveLatest(r.answer.id, r.answer.title);
      },
    );
  };
  const open = (id: string) => show(id, false);
  const pick = (id: string) => show(id, true);

  /** An earlier question from the history, asked again or reopened. */
  const again = (q: string, id?: string) => {
    draft.set(q);
    if (id !== undefined) {
      lastAsked = normalise(q);
      open(id);
      return;
    }
    lastAsked = "";
    clearTimeout(timer);
    ask(q);
  };

  const fromHash = () => {
    const id = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (idPattern.test(id)) open(id);
  };
  fromHash();
  window.addEventListener("hashchange", fromHash);
  onCleanup(() => {
    window.removeEventListener("hashchange", fromHash);
    clearTimeout(timer);
  });

  effect(() => {
    const r = reply();
    document.title = r?.answer !== undefined ? `${r.answer.title} | ビットコイン Q&A` : "ビットコイン Q&A";
  });

  return (
    <div>
      <Owl mood={mood} />

      <form
        class={s.field}
        onSubmit={(event: Event) => {
          event.preventDefault();
          clearTimeout(timer);
          ask(draft.peek());
        }}
      >
        <input
          type="text"
          autocomplete="off"
          enterkeyhint="search"
          aria-label="ビットコインについての質問"
          placeholder="例：秘密鍵をなくしたらどうなる？"
          maxLength={400}
          value={draft}
          ref={(el: Element) => {
            // Not on a touch screen: the keyboard would cover the owl before
            // the reader has seen it.
            if (!window.matchMedia("(pointer: coarse)").matches) (el as HTMLInputElement).focus();
          }}
          onInput={(event: Event) => {
            draft.set((event.target as HTMLInputElement).value);
            schedule();
          }}
          onCompositionstart={() => {
            composing = true;
            clearTimeout(timer);
          }}
          onCompositionend={() => {
            composing = false;
            schedule();
          }}
        />
      </form>

      <Show when={() => error() !== ""}>
        <p class={s.error}>{error}</p>
      </Show>

      <div class={() => `${s.reply} ${busy() ? "stale" : ""}`}>
        {() => {
          const r = reply();
          if (r === null) return null;
          return (
            <div>
              {r.answer !== undefined ? (
                <div class={s.card}>
                  <AnswerCard entry={r.answer} expand={r.expand} open={open} />
                </div>
              ) : null}
              {(r.message ?? []).length > 0 && r.status !== "suggest" ? (
                <div class={`${s.card} message`}>
                  {(r.message ?? []).map((line) => (
                    <p>{line}</p>
                  ))}
                </div>
              ) : null}
              {(r.suggestions ?? []).length > 0 ? <Suggestions
                  label={r.status === "multiple" ? "近い質問" : "もしかして"}
                  items={r.suggestions ?? []}
                  open={pick}
                /> : null}
            </div>
          );
        }}
      </div>

      <HistoryPanel again={again} />
    </div>
  );
}
