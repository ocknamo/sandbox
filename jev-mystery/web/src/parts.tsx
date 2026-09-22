/**
 * The pieces of the screen. Each takes accessors rather than values, so a
 * panel re-reads what changed instead of being rebuilt.
 */
import { For, Show } from "@kanabun/core";
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
    }
  | { kind: "answer"; text: string }
  | { kind: "ending"; verdict: Verdict };

/**
 * One portrait. A case may ship a picture; a case without one is played with
 * the glyph, and the glyph is what the picture is drawn over rather than
 * instead of, so a URL that never loads leaves the face behind it rather than
 * a hole: `onError` takes the image back out and the glyph is already there.
 *
 * The picture's own address comes from `portrait`, because a case keeps its
 * pictures where it keeps itself: with the service.
 */
export function Avatar(props: { person: Person }) {
  const person = props.person;
  return (
    <div class={s.avatar}>
      <span>{person.avatar || "？"}</span>
      {person.image ? (
        <img
          src={portrait(person.image)}
          alt={person.name}
          loading="lazy"
          onError={(event: Event) => (event.currentTarget as HTMLImageElement).remove()}
        />
      ) : null}
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
    return <Ending verdict={entry.verdict} />;
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
    </div>
  );
}

/**
 * The ending, and the scorecard behind it. The scorecard is safe here and
 * nowhere earlier: the case is over by the time it is read.
 *
 * Only the elements the player reached are named. The rest are counted and
 * left unsaid, because the label of an element is a one-line statement of it:
 * a player who wrote half a solution and was shown "一匹分の足跡" against a ×
 * has just been told the other half, which is the one thing this screen must
 * not do. The count still says how much was left, which is what the player
 * actually wants to know.
 */
function Ending(props: { verdict: Verdict }) {
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

  return (
    <div class="entry said">
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
    </div>
  );
}
