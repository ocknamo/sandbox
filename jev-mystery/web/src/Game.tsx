/**
 * One playthrough.
 *
 * The case is chosen by the route, so `#yakata` is a link to a case and
 * nothing else in the app has to know which one is being played. Everything
 * the player reads arrives from the service; the page keeps only the log of
 * what has been read and the state token that says where they are.
 *
 * That much is kept in localStorage, per case, so a reload or a closed tab
 * picks up where the player left off — including the way back from a missed
 * accusation and the hints already read. Storage is a convenience: when it is
 * unavailable, the page plays exactly as it would without it.
 */
import { For, Show, effect, resource, signal } from "@kanabun/core";
import { useParams } from "@kanabun/router";
import * as api from "./api";
import { ItemsPanel, LogEntry, PlacePanel } from "./parts";
import type { Entry } from "./parts";
import * as s from "./styles";

type Phase = "playing" | "accusing" | "closed";

/** Everything the page needs to carry on from where the player left off. */
interface Saved {
  token: string;
  view: api.View;
  entries: Entry[];
  phase: Phase;
  beforeAnswer: string;
  hints: string[];
  shown: number;
}

const storageKey = (id: string) => `jev-mystery:${id}`;

function load(id: string): Saved | null {
  try {
    const raw = localStorage.getItem(storageKey(id));
    return raw === null ? null : (JSON.parse(raw) as Saved);
  } catch {
    return null;
  }
}

function save(id: string, saved: Saved) {
  try {
    localStorage.setItem(storageKey(id), JSON.stringify(saved));
  } catch {
    // A full or blocked storage only costs the resume.
  }
}

function forget(id: string) {
  try {
    localStorage.removeItem(storageKey(id));
  } catch {
    // Nothing was saved, then.
  }
}

export function Game() {
  const params = useParams();
  const [started, { refetch }] = resource(
    () => params()["case"] ?? false,
    (id: string) => api.newGame(id),
  );

  const token = signal("");
  const view = signal<api.View | null>(null);
  const entries = signal<Entry[]>([]);
  const phase = signal<Phase>("playing");
  const draft = signal("");
  const busy = signal(false);
  const error = signal("");
  // The state as it stood just before the last accusation, so a player who
  // missed can take their answer back instead of starting the case over. The
  // service keeps nothing between requests: holding the earlier token is all
  // going back needs.
  const beforeAnswer = signal("");
  // The case's hints, once a missed accusation has brought them, and how many
  // of them the player has asked to see.
  const hints = signal<string[]>([]);
  const shown = signal(0);

  let logEl: Element | null = null;
  let inputEl: HTMLInputElement | null = null;

  const caseId = () => params()["case"] ?? "";
  // The case the board is showing. Saving goes by this rather than by the
  // route, so a route that has already moved on never files one case's game
  // under another's name.
  let playing = "";

  // A new case — or a restart, which refetches — begins here. A case already
  // under way in this browser is picked up instead of begun again.
  effect(() => {
    const start = started();
    if (start === undefined) return;
    document.title = start.title;
    draft.set("");
    error.set("");
    playing = caseId();
    const saved = load(playing);
    if (saved !== null) {
      token.set(saved.token);
      view.set(saved.view);
      entries.set(saved.entries);
      phase.set(saved.phase);
      beforeAnswer.set(saved.beforeAnswer);
      hints.set(saved.hints);
      shown.set(saved.shown);
      requestAnimationFrame(() => logEl?.lastElementChild?.scrollIntoView({ block: "end" }));
      return;
    }
    token.set(start.state);
    view.set(start.view);
    // Where the case opens is described in the log as well as in the panel
    // beside it: the first thing a player reads should include the room they
    // are standing in.
    const arrival = start.arrival ?? [];
    entries.set([
      { kind: "narration", lines: start.opening },
      { kind: "narration", lines: start.incident },
      ...(arrival.length > 0 ? [{ kind: "narration" as const, lines: arrival }] : []),
    ]);
    phase.set("playing");
    beforeAnswer.set("");
    hints.set([]);
    shown.set(0);
  });

  // Every change worth resuming from is written back as it happens.
  effect(() => {
    const v = view();
    if (v === null || playing === "") return;
    save(playing, {
      token: token(),
      view: v,
      entries: entries(),
      phase: phase(),
      beforeAnswer: beforeAnswer(),
      hints: hints(),
      shown: shown(),
    });
  });

  // The board is cleared before the refetch, so nothing is written back
  // between forgetting the game and the new one arriving.
  const restart = () => {
    view.set(null);
    forget(playing);
    refetch();
  };

  const append = (entry: Entry) => {
    entries.update((list) => [...list, entry]);
    // After the entry is in the DOM, put its end on screen.
    requestAnimationFrame(() => logEl?.lastElementChild?.scrollIntoView({ block: "end" }));
  };

  const fail = (err: unknown) => error.set(err instanceof Error ? err.message : String(err));

  const play = async (input: string) => {
    if (busy.peek() || input === "") return;
    busy.set(true);
    error.set("");
    try {
      const turn = await api.act(token.peek(), input);
      token.set(turn.state);
      view.set(turn.view);
      append({
        kind: "turn",
        input,
        matched: turn.matched,
        did: turn.did,
        speaker: turn.speaker,
        lines: turn.text,
        gained: turn.gained ?? [],
        moved: turn.moved_to === undefined ? undefined : turn.view.scene.name,
        arrival: turn.arrival ?? [],
        interlude: turn.interlude ?? [],
      });
      // The finale is not a screen the player opens: they ask to gather
      // everyone, in whatever words, and the service decides whether they may.
      if (turn.finale === true) phase.set("accusing");
    } catch (err) {
      fail(err);
    } finally {
      busy.set(false);
      inputEl?.focus();
    }
  };

  const declare = async (answer: string) => {
    if (busy.peek() || answer === "") return;
    busy.set(true);
    error.set("");
    append({ kind: "answer", text: answer });
    try {
      const before = token.peek();
      const verdict = await api.accuse(before, answer);
      beforeAnswer.set(before);
      token.set(verdict.state);
      if (verdict.hints !== undefined && verdict.hints.length > 0) hints.set(verdict.hints);
      append({
        kind: "ending",
        verdict,
        share: { title: started()?.title ?? "", turns: view()?.turn ?? 0 },
      });
      phase.set("closed");
    } catch (err) {
      fail(err);
    } finally {
      busy.set(false);
    }
  };

  /** Take the last answer back: everyone is gathered again, and nothing else changes. */
  const rewind = () => {
    if (busy.peek() || beforeAnswer.peek() === "") return;
    token.set(beforeAnswer.peek());
    error.set("");
    append({ kind: "narration", lines: ["――もう一度、考え直すことにした。"] });
    phase.set("accusing");
  };

  // `at` reads the current view without this function subscribing to it: the
  // board is built once and its leaves re-read what changed. Reading view()
  // here instead would rebuild the log on every turn.
  const at = (): api.View => view() as api.View;

  const board = () => {
    return (
      <div>
        <Show when={() => at().finale_open && phase() === "playing"}>
          <div class={s.banner}>
            <p>手の中のもので、そろそろ話がつながりそうだ。</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => play(at().finale_label ?? "全員を集める")}
            >
              {() => at().finale_label ?? "全員を集める"}
            </button>
          </div>
        </Show>

        <div class={s.columns}>
          <div>
            <PlacePanel view={at} />
            <ItemsPanel view={at} />
          </div>
          <div>
            <div class={`${s.card} ${s.log}`} ref={(el: Element) => (logEl = el)}>
              <For each={entries}>{(entry: Entry) => <LogEntry entry={entry} />}</For>
              <Show when={busy}>
                <p class={s.waiting}>……</p>
              </Show>
            </div>
            <Show when={() => phase() !== "closed"} fallback={() => <Closed />}>
              {() => <Control />}
            </Show>
            <Show when={() => hints().length > 0}>{() => <Hints />}</Show>
          </div>
        </div>
      </div>
    );
  };

  /** The turn form, or the accusation form once everyone is gathered. */
  const Control = () => (
    <div class={`${s.card} ${s.control}`}>
      <Show when={() => phase() === "playing"} fallback={() => <Accusation />}>
        <div>
        <form
          onSubmit={(event: Event) => {
            event.preventDefault();
            const input = draft.peek().trim();
            draft.set("");
            void play(input);
          }}
        >
          <input
            type="text"
            autocomplete="off"
            placeholder="何をしますか"
            value={draft}
            disabled={busy}
            ref={(el: Element) => {
              inputEl = el as HTMLInputElement;
              inputEl.focus();
            }}
            onInput={(event: Event) => draft.set((event.target as HTMLInputElement).value)}
          />
          <button type="submit" disabled={busy}>
            する
          </button>
        </form>
        <p class="hint">
          思いついたことを書いてください。できることの一覧はありません。
          ここにいる人には、何を訊いても構いません。話を聞かせてくれと頼んでも、
          「〜ですか」と一言で確かめても、どちらでも通ります。
        </p>
        <Show when={() => at().finale_open}>
          <div class={s.gather}>
            {/* Outlined, not solid: the banner at the top of the board is the
                offer, and this is the reminder sitting next to a submit button
                it must not be mistaken for. */}
            <button
              type="button"
              class="secondary"
              disabled={busy}
              onClick={() => play(at().finale_label ?? "全員を集める")}
            >
              {() => at().finale_label ?? "全員を集める"}
            </button>
            <p class="hint">
              いつでも集められます。まだ聞き込みを続けても構いません。
            </p>
          </div>
        </Show>
        </div>
      </Show>
      <Show when={() => error() !== ""}>
        <p class="error">{error}</p>
      </Show>
    </div>
  );

  /** After the ending: a way back to before the answer. */
  const Closed = () => (
    <div class={`${s.card} ${s.control}`}>
      <button type="button" class="secondary" disabled={busy} onClick={rewind}>
        推理を述べる前に戻る
      </button>
      <p class="hint">集めた手がかりはそのままに、推理だけを書き直せます。</p>
    </div>
  );

  /**
   * The case's hints, one per press. Offered only once an accusation has
   * missed, and kept on screen after going back, which is when they are read.
   */
  const Hints = () => (
    <div class={`${s.card} ${s.hints}`}>
      <For each={() => hints().slice(0, shown())}>
        {(hint: string, i: number) => <p>{`ヒント${i + 1}　${hint}`}</p>}
      </For>
      <Show when={() => shown() < hints().length}>
        <button type="button" class="secondary" onClick={() => shown.update((n) => n + 1)}>
          {() => (shown() === 0 ? "ヒントを見る" : "次のヒントを見る")}
        </button>
      </Show>
    </div>
  );

  const Accusation = () => {
    const answer = signal("");
    return (
      <div>
        <form
          class="stacked"
          onSubmit={(event: Event) => {
            event.preventDefault();
            void declare(answer.peek().trim());
          }}
        >
          <textarea
            placeholder="誰が、どうやって、なぜ。"
            value={answer}
            disabled={busy}
            ref={(el: Element) => (el as HTMLTextAreaElement).focus()}
            onInput={(event: Event) => answer.set((event.target as HTMLTextAreaElement).value)}
          />
          <p>
            <button type="submit" disabled={busy}>
              推理を述べる
            </button>
          </p>
        </form>
        <p class="hint">文章で書いてください。名指しだけでも、筋道まで書いても構いません。</p>
        <div class={s.gather}>
          <button type="button" class="secondary" disabled={busy} onClick={() => phase.set("playing")}>
            聞き込みに戻る
          </button>
          <p class="hint">まだ推理を述べずに、館の中を調べ直せます。</p>
        </div>
      </div>
    );
  };

  // One element at the root: see the note in CasePicker. A fragment here is
  // read inside the router's effect and turns every state change into a
  // restart of the case.
  return (
    <div>
      <div class="titlebar">
        <div>
          <h1>{() => started()?.title ?? "……"}</h1>
          <p class="byline">{() => started()?.byline ?? ""}</p>
        </div>
        <Show when={() => started() !== undefined}>
          <button type="button" class="secondary" disabled={busy} onClick={restart}>
            最初から
          </button>
        </Show>
      </div>

      <Show when={() => started.error() !== undefined}>
        <div class={s.card}>
          <p>この事件は見つかりませんでした。</p>
          <p>
            <a href="#">事件の一覧へ</a>
          </p>
        </div>
      </Show>

      <Show when={() => view() !== null}>{board}</Show>
    </div>
  );
}
