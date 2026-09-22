/**
 * One playthrough.
 *
 * The case is chosen by the route, so `#yakata` is a link to a case and
 * nothing else in the app has to know which one is being played. Everything
 * the player reads arrives from the service; the page keeps only the log of
 * what has been read and the state token that says where they are.
 */
import { For, Show, effect, resource, signal } from "@kanabun/core";
import { useParams } from "@kanabun/router";
import * as api from "./api";
import { ItemsPanel, LogEntry, PlacePanel } from "./parts";
import type { Entry } from "./parts";
import * as s from "./styles";

type Phase = "playing" | "accusing" | "closed";

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

  let logEl: Element | null = null;
  let inputEl: HTMLInputElement | null = null;

  // A new case — or a restart, which refetches — begins here.
  effect(() => {
    const start = started();
    if (start === undefined) return;
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
    draft.set("");
    error.set("");
    document.title = start.title;
  });

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
      const verdict = await api.accuse(token.peek(), answer);
      token.set(verdict.state);
      append({ kind: "ending", verdict });
      phase.set("closed");
    } catch (err) {
      fail(err);
    } finally {
      busy.set(false);
    }
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
            <Show when={() => phase() !== "closed"}>{() => <Control />}</Show>
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
          ここにいる人には、はい か いいえ で答えられる質問を、そのまま投げられます。
        </p>
        </div>
      </Show>
      <Show when={() => error() !== ""}>
        <p class="error">{error}</p>
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
          <button type="button" class="secondary" disabled={busy} onClick={() => refetch()}>
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
