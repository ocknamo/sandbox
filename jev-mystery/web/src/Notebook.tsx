/**
 * The detective's notebook: who has been met, what has been found, and where
 * the player is standing, one tap away from wherever they have scrolled to.
 *
 * The panels at the top of the board say the same things, but the log grows
 * under them and a player deep in it had to scroll all the way back up to
 * check a name or a piece of evidence. The notebook sits in the corner of the
 * screen instead, and it is also how a name gets into the input without being
 * typed: a misspelt name is a missed accusation, and the player should not
 * have to remember how a name is written to say it.
 *
 * Nothing here is new information. Every person in it has been seen, every
 * item has been found; the notebook only keeps them within reach.
 */
import { For, Show, onCleanup, signal, untrack } from "@kanabun/core";
import type { Item, Person, View } from "./api";
import closedImage from "./assets/notebook-closed.png";
import openImage from "./assets/notebook-open.png";
import { Avatar } from "./parts";
import * as s from "./styles";

type Tab = "people" | "evidence" | "place";

export function Notebook(props: {
  view: () => View;
  /** Everyone the player has seen so far, in the order they were met. */
  met: () => Person[];
  /**
   * Writes a name into whichever field the player is writing in, or null when
   * there is nowhere to write: after the ending, or while a turn is out.
   */
  write: () => ((text: string) => void) | null;
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

  /**
   * Into the field, then out of the way: the book sits over the field it
   * has just written into — all of it on a phone, the end of it with the
   * submit button beside a wide page — and the player wants to read on.
   */
  const jot = (text: string) => {
    const write = props.write();
    if (write === null) return;
    hide();
    write(text);
  };

  const here = (person: Person) => (props.view().people ?? []).some((p) => p.id === person.id);

  const Jot = (p: { text: string; label: string }) => (
    <Show when={() => props.write() !== null}>
      <button type="button" class="jot" aria-label={p.label} onClick={() => jot(p.text)}>
        ✎ 書き込む
      </button>
    </Show>
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
      <For each={props.met} fallback={<p class="none">まだ誰にも会っていない。</p>}>
        {(person: Person) => (
          <div class="row">
            <Avatar person={person} />
            <div class="body">
              <div class="name">
                {person.name}
                <Show when={() => here(person)}>
                  <span class="here">ここにいる</span>
                </Show>
              </div>
              <div class="desc">{person.role}</div>
            </div>
            <Jot text={person.name} label={`${person.name}の名前を入力欄に書き込む`} />
          </div>
        )}
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
            <Jot text={item.name} label={`${item.name}を入力欄に書き込む`} />
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
            <TabButton id="people" label={() => `人物 ${props.met().length}`} />
            <TabButton id="evidence" label={() => `証拠 ${evidence().length}`} />
            <TabButton id="place" label={() => "現在地"} />
          </div>
          <div class="page">
            {() => (tab() === "people" ? <People /> : tab() === "evidence" ? <Evidence /> : <Place />)}
            <Show when={() => props.write() !== null && tab() !== "place"}>
              <p class="tip">「書き込む」で、その名前を入力欄に書き込めます。</p>
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
