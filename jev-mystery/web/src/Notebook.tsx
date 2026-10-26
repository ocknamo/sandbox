/**
 * The detective's notebook: who has been met, what has been found, and where
 * the player is standing, one tap away from wherever they have scrolled to.
 *
 * The panels at the top of the board say the same things, but the log grows
 * under them and a player deep in it had to scroll all the way back up to
 * check a name or a piece of evidence. The notebook sits in the corner of the
 * screen instead, and every name in it can be copied, to be pasted rather than
 * typed: a misspelt name is a missed accusation, and the player should not
 * have to remember how a name is written to say it.
 *
 * Nothing here is new information. Every person in it has been seen or named
 * in the opening, every item has been found; the notebook only keeps them
 * within reach.
 */
import { For, Show, onCleanup, signal, untrack } from "@kanabun/core";
import type { Item, Person, View } from "./api";
import closedImage from "./assets/notebook-closed.png";
import openImage from "./assets/notebook-open.png";
import { Avatar, copyText } from "./parts";
import * as s from "./styles";

type Tab = "people" | "evidence" | "place";

export function Notebook(props: {
  view: () => View;
  /** Everyone the player has seen so far, in the order they were met. */
  met: () => Person[];
  /** Kept out of the way, e.g. while the keyboard is up on a phone. */
  hidden: () => boolean;
}) {
  const open = signal(false);
  const tab = signal<Tab>("people");
  const evidence = () => props.view().evidence ?? [];

  // How much evidence the player had when they last looked, so the button can
  // say that something new has gone in, and the list can say which.
  // Read untracked: the notebook is built once, and reading the view here
  // would rebuild it — and forget what was seen — on every turn.
  const held = untrack(() => evidence().length);
  const seen = signal(held);
  const freshFrom = signal(held);
  const unseen = () => Math.max(0, evidence().length - seen());

  let panelEl: HTMLElement | null = null;

  const show = () => {
    // Something new is what the player most likely opened it for.
    if (unseen() > 0) tab.set("evidence");
    freshFrom.set(seen.peek());
    seen.set(evidence().length);
    open.set(true);
    requestAnimationFrame(() => panelEl?.focus());
  };
  const hide = () => {
    // Anything found while the notebook was open has been seen too.
    seen.set(evidence().length);
    open.set(false);
  };
  const toggle = () => (open.peek() ? hide() : show());

  const onKey = (event: KeyboardEvent) => {
    if (event.key === "Escape" && open.peek()) hide();
  };
  document.addEventListener("keydown", onKey);
  onCleanup(() => document.removeEventListener("keydown", onKey));

  const here = (person: Person) => (props.view().people ?? []).some((p) => p.id === person.id);

  // The victim heads the list; everyone else in the order they were met. A
  // case that puts its victim in a room as well lists them once.
  const victim = () => props.view().victim;
  const others = () => props.met().filter((p) => p.id !== victim()?.id);

  /**
   * Copies a name and says so in place. The book stays open: the player may
   * want another name, and pasting is theirs to do wherever they are writing.
   */
  const Copy = (p: { text: string; label: string }) => {
    const copied = signal(false);
    const copy = async () => {
      await copyText(p.text);
      copied.set(true);
      setTimeout(() => copied.set(false), 1500);
    };
    return (
      <button
        type="button"
        class={() => (copied() ? "copy done" : "copy")}
        aria-label={p.label}
        onClick={() => void copy()}
      >
        {() => (copied() ? "✓ コピー済み" : "コピー")}
      </button>
    );
  };

  const PersonRow = (p: { person: Person; victim?: boolean }) => (
    <div class="row">
      <Avatar person={p.person} />
      <div class="body">
        <div class="name">
          {p.person.name}
          {p.victim ? <span class="victim">被害者</span> : null}
          <Show when={() => here(p.person)}>
            <span class="here">ここにいる</span>
          </Show>
        </div>
        <div class="desc">{p.person.role}</div>
      </div>
      <Copy text={p.person.name} label={`${p.person.name}の名前をコピー`} />
    </div>
  );

  const TabButton = (p: { id: Tab; label: () => string }) => (
    <button
      type="button"
      role="tab"
      class={() => (tab() === p.id ? "tab on" : "tab")}
      aria-selected={() => String(tab() === p.id)}
      onClick={() => tab.set(p.id)}
    >
      {p.label}
    </button>
  );

  const People = () => (
    <div class="list">
      {() => {
        const v = victim();
        return v === undefined ? null : <PersonRow person={v} victim />;
      }}
      <For each={others} fallback={<p class="none">まだ誰にも会っていない。</p>}>
        {(person: Person) => <PersonRow person={person} />}
      </For>
    </div>
  );

  const Evidence = () => (
    <div class="list">
      <For each={evidence} fallback={<p class="none">まだ何も持っていない。</p>}>
        {(item: Item, i: number) => (
          <div class="row">
            <div class="body">
              <div class="name">
                {item.name}
                <Show when={() => i >= freshFrom()}>
                  <span class="new">新</span>
                </Show>
              </div>
              <div class="desc">{item.description}</div>
            </div>
            <Copy text={item.name} label={`${item.name}をコピー`} />
          </div>
        )}
      </For>
    </div>
  );

  const Place = () => (
    <div class="list">
      <p class="scene">{() => props.view().scene.name}</p>
      {() => props.view().scene.description.map((line) => <p class="desc">{line}</p>)}
      <p class="present">
        {() => {
          const people = props.view().people ?? [];
          return people.length === 0
            ? "ここには誰もいない。"
            : `ここにいるのは、${people.map((p) => p.name).join("、")}。`;
        }}
      </p>
    </div>
  );

  // One element at the root, for the reason given in CasePicker.
  return (
    <div class={s.notebook}>
      <Show when={open}>
        <div class="backdrop" onClick={hide} />
        <section
          class="book"
          role="dialog"
          aria-label="手帳"
          tabindex={-1}
          ref={(el: Element) => (panelEl = el as HTMLElement)}
        >
          <header>
            <h2>手帳</h2>
            <button type="button" class="close" aria-label="手帳を閉じる" onClick={hide}>
              ×
            </button>
          </header>
          <div class="tabs" role="tablist">
            <TabButton
              id="people"
              label={() => `人物 ${others().length + (victim() === undefined ? 0 : 1)}`}
            />
            <TabButton id="evidence" label={() => `証拠 ${evidence().length}`} />
            <TabButton id="place" label={() => "現在地"} />
          </div>
          <div class="page">
            {() => (tab() === "people" ? <People /> : tab() === "evidence" ? <Evidence /> : <Place />)}
            <Show when={() => tab() !== "place"}>
              <p class="tip">名前をコピーして、入力欄に貼り付けられます。</p>
            </Show>
          </div>
        </section>
      </Show>

      <button
        type="button"
        class={() => (props.hidden() ? "fab gone" : open() ? "fab opened" : "fab")}
        aria-label={() => (open() ? "手帳を閉じる" : "手帳を開く")}
        aria-expanded={() => String(open())}
        onClick={toggle}
      >
        <img src={() => (open() ? openImage : closedImage)} alt="" width="64" height="64" />
        <Show when={() => unseen() > 0 && !open()}>
          <span class="badge">{() => `+${unseen()}`}</span>
        </Show>
      </button>
    </div>
  );
}
