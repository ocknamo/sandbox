/**
 * The pieces of the screen. Each takes accessors rather than values, so a
 * panel re-reads what changed instead of being rebuilt.
 */
import { For, Show, signal } from "@kanabun/core";
import { portrait } from "./api";
import type { Item, Person, Verdict, View } from "./api";
import * as s from "./styles";

/** One entry in the log. The log is the game: nothing is ever removed from it. */
export type Entry =
  | { kind: "narration"; lines: string[] }
  | {
      kind: "turn";
      input: string;
      matched: boolean;
      did?: string;
      speaker?: Person;
      lines: string[];
      gained: Item[];
      moved?: string;
      /** The room walked into, described. Empty unless the turn moved. */
      arrival: string[];
      /** What the case says unprompted because this turn completed something. */
      interlude: string[];
    }
  | { kind: "answer"; text: string }
  | {
      kind: "ending";
      verdict: Verdict;
      /**
       * The case's title and how many turns it took, for the result the
       * player can share. Optional because a log saved before sharing existed
       * has endings without it, and those still render.
       */
      share?: { title: string; turns: number };
    };

/**
 * One portrait. A case may ship a picture; a case without one is played with
 * the glyph, and the glyph is what the picture is drawn over rather than
 * instead of, so a URL that never loads leaves the face behind it rather than
 * a hole.
 *
 * A single failed load is not trusted: a cold Cloud Run instance or one
 * dropped connection is enough to trip `onError` on an otherwise good
 * picture, and giving up on the first attempt would leave a face missing for
 * the rest of the game over nothing. So `onError` is a retry, once, with a
 * cache-busting query so the browser does not just replay the same failed
 * response — and only the second failure lets the glyph win for good.
 *
 * The picture's own address comes from `portrait`, because a case keeps its
 * pictures where it keeps itself: with the service.
 */
export function Avatar(props: { person: Person }) {
  const person = props.person;
  const failures = signal(0);
  return (
    <div class={s.avatar}>
      <span>{person.avatar || "？"}</span>
      {() => {
        if (!person.image || failures() >= 2) return null;
        const base = portrait(person.image);
        return (
          <img
            src={failures() === 0 ? base : `${base}${base.includes("?") ? "&" : "?"}retry=${failures()}`}
            alt={person.name}
            loading="lazy"
            onError={() => failures.update((n) => n + 1)}
          />
        );
      }}
    </div>
  );
}

export function PlacePanel(props: { view: () => View }) {
  return (
    <div class={s.card}>
      <h2>いま いる ところ</h2>
      <div class={s.place}>
        <p class="name">{() => props.view().scene.name}</p>
        {() => props.view().scene.description.map((line) => <p class="desc">{line}</p>)}
        <div class="people">
          <For
            each={() => props.view().people ?? []}
            fallback={<p class={s.empty}>ここには誰もいない。</p>}
          >
            {(person) => (
              <div class="person">
                <Avatar person={person} />
                <div>
                  <div class="who">{person.name}</div>
                  <div class="role">{person.role}</div>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}

export function ItemsPanel(props: { view: () => View }) {
  return (
    <div class={s.card}>
      <h2>手 の 中 の もの</h2>
      <div class={s.items}>
        <For
          each={() => props.view().evidence ?? []}
          fallback={<p class={s.empty}>まだ何も持っていない。</p>}
        >
          {(item: Item) => (
            <div class="item">
              <div class="name">{item.name}</div>
              <div class="desc">{item.description}</div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

/**
 * One log entry. An entry never changes once it is written, so everything here
 * is rendered once: only the list of entries is reactive.
 */
export function LogEntry(props: { entry: Entry }) {
  const entry = props.entry;

  if (entry.kind === "narration") {
    return <div class="entry">{entry.lines.map((line) => <p>{line}</p>)}</div>;
  }

  if (entry.kind === "answer") {
    return (
      <div class="entry said">
        <p class="typed">{entry.text}</p>
      </div>
    );
  }

  if (entry.kind === "ending") {
    return <Ending verdict={entry.verdict} share={entry.share} />;
  }

  return (
    <div class={entry.matched ? "entry said" : "entry said miss"}>
      <p class="typed">{"> " + entry.input}</p>
      {entry.speaker ? (
        <div class="speaker">
          <Avatar person={entry.speaker} />
          <div class="who">{entry.speaker.name}</div>
        </div>
      ) : null}
      {entry.did ? <p class="did">{entry.did}</p> : null}
      {entry.lines.map((line) => <p>{line}</p>)}
      {entry.gained.map((item) => <div class="found">{"見つけた: " + item.name}</div>)}
      {entry.moved ? <div class="moved">{"— " + entry.moved + " —"}</div> : null}
      {entry.arrival.length > 0 ? (
        <div class="arrival">{entry.arrival.map((line) => <p>{line}</p>)}</div>
      ) : null}
      {entry.interlude.length > 0 ? (
        <div class="interlude">{entry.interlude.map((line) => <p>{line}</p>)}</div>
      ) : null}
    </div>
  );
}

/**
 * The ending, and the scorecard behind it. The scorecard is safe here and
 * nowhere earlier: the case is over by the time it is read.
 *
 * An ending the case marks as a win is drawn as one. The log is otherwise
 * level throughout — a turn that cracks the case looks exactly like a turn
 * that finds nothing — and this is the one screen that is allowed to say the
 * player got there.
 *
 * Only the elements the player reached are named. The rest are counted and
 * left unsaid, because the label of an element is a one-line statement of it:
 * a player who wrote half a solution and was shown "一匹分の足跡" against a ×
 * has just been told the other half, which is the one thing this screen must
 * not do. The count still says how much was left, which is what the player
 * actually wants to know.
 */
function Ending(props: { verdict: Verdict; share?: { title: string; turns: number } }) {
  const v = props.verdict;
  const named = v.correct
    ? `犯人を言い当てた（${v.named_name}）`
    : v.named_name
      ? `${v.named_name}を指した`
      : "犯人を名指ししなかった";

  const row = (hit: boolean, label: string) => [
    <span class={hit ? "mark" : "mark no"}>{hit ? "○" : "×"}</span>,
    <span>{label}</span>,
  ];

  const found = v.points.filter((point) => point.hit);
  const missed = v.points.length - found.length;

  const width = `${Math.round((100 * v.coherence) / (v.coherence_top || 1))}%`;

  const won = v.celebrate === true;
  const banner = complete(v) ? "完 全 解 決" : "事 件 解 決";

  return (
    <div class={won ? "entry said won" : "entry said"}>
      {won ? <p class="solved">{banner}</p> : null}
      <h3>{v.title}</h3>
      {v.text.map((line) => <p>{line}</p>)}
      <div class="score">
        {row(v.correct, named)}
        {found.map((point) => row(true, point.label))}
        {missed > 0
          ? [
              <span class="mark no">×</span>,
              <span class="veiled">{`辿り着かなかったことが、あと ${missed} つ`}</span>,
            ]
          : null}
      </div>
      <div class="coherence">
        {`筋の通り ${v.coherence.toFixed(1)} / ${v.coherence_top}`}
        <div class="track">
          <div style={{ width }} />
        </div>
        <Show when={() => v.coherence_legend !== undefined}>{v.coherence_legend}</Show>
      </div>
      {props.share ? <Share text={shareText(v, props.share)} title={props.share.title} /> : null}
    </div>
  );
}

/**
 * Whether the case was solved outright. The case says which of its endings
 * counts — it may ask for the heart of the matter rather than every point on
 * the scorecard — and an ending it has not marked still counts when nothing at
 * all was left behind, which is also how an ending saved before the case could
 * say so is read.
 */
function complete(v: Verdict): boolean {
  if (v.celebrate !== true) return false;
  return v.complete === true || (v.correct && v.points.every((point) => point.hit));
}

/**
 * The result as the player would post it.
 *
 * It says how well they did and nothing about what they found. The ending's
 * title, the name they gave and the labels of the elements they reached are
 * each a piece of the answer, and this text is meant for people who have not
 * played yet — so it carries marks and counts, the way the scorecard does for
 * what the player missed.
 */
export function shareText(v: Verdict, share: { title: string; turns: number }): string {
  const found = v.points.filter((point) => point.hit).length;
  const result = complete(v) ? "完全解決" : v.celebrate === true ? "事件解決" : "未解決";
  const marks = v.points.map((point) => (point.hit ? "○" : "×")).join("");
  return [
    `『${share.title}』${result}`,
    `犯人 ${v.correct ? "○" : "×"}／真相 ${marks} ${found}/${v.points.length}`,
    `筋の通り ${v.coherence.toFixed(1)}/${v.coherence_top}・${share.turns}手`,
    "#jevmystery",
  ].join("\n");
}

/**
 * The link to the case, without `?api=`: that points the page at a service
 * somebody was testing against, and a friend following the link wants the
 * real one.
 */
function shareURL(): string {
  const url = new URL(location.href);
  url.searchParams.delete("api");
  return url.toString();
}

/**
 * Two ways to take the result off the page: the device's own share sheet,
 * where there is one, and a plain copy to the clipboard, which works
 * everywhere and is what a desktop browser is left with.
 */
function Share(props: { text: string; title: string }) {
  const url = shareURL();
  const copied = signal(false);
  const canShare = typeof navigator.share === "function";

  const share = () => {
    navigator.share({ title: props.title, text: props.text, url }).catch(() => {
      // Closing the share sheet rejects, and that is not an error to report.
    });
  };

  const copy = async () => {
    const all = `${props.text}\n${url}`;
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
    <div class="share">
      <pre>{props.text}</pre>
      <div class="buttons">
        {canShare ? (
          <button type="button" class="secondary" onClick={share}>
            共有する
          </button>
        ) : null}
        <button type="button" class="secondary" onClick={() => void copy()}>
          {() => (copied() ? "コピーしました" : "結果をコピー")}
        </button>
      </div>
    </div>
  );
}
