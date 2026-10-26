/**
 * Scoped styles, via core's `css` helper: each block is hashed and injected
 * once, so a class name here cannot collide with one anywhere else.
 *
 * The palette lives in index.html as custom properties, because it belongs to
 * the page rather than to any one component, and because the light/dark
 * switch has to apply before the first paint.
 */
import { css } from "@kanabun/core";

export const shell = css`
  max-width: 960px;
  margin: 0 auto;
  /* Room at the bottom for the notebook in the corner, so the last of the
     page can always be scrolled out from under it. */
  padding: 32px 20px calc(104px + env(safe-area-inset-bottom));

  .titlebar {
    display: flex;
    gap: 16px;
    align-items: baseline;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  h1 {
    font-size: 24px;
    margin: 0;
    letter-spacing: 0.02em;
  }

  .byline {
    color: var(--muted);
    font-size: 13px;
    margin: 2px 0 20px;
  }

  footer {
    color: var(--muted);
    font-size: 12px;
    margin-top: 28px;
    font-family: var(--ui);
  }

  footer a {
    color: inherit;
  }
`;

export const columns = css`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  align-items: start;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

export const card = css`
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 16px 18px;
  margin-bottom: 16px;

  h2 {
    font-size: 13px;
    margin: 0 0 10px;
    color: var(--muted);
    font-weight: 600;
    letter-spacing: 0.08em;
    font-family: var(--ui);
  }
`;

/** The place and the people standing in it. */
export const place = css`
  .name {
    font-size: 17px;
    margin: 0 0 8px;
  }

  .desc {
    color: var(--muted);
    font-size: 13.5px;
    margin: 0 0 4px;
  }

  .people {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 12px;
  }

  .person {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .person .who {
    font-size: 14px;
    line-height: 1.3;
  }

  .person .role {
    font-size: 12px;
    color: var(--muted);
  }
`;

export const avatar = css`
  position: relative;
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: var(--bg);
  overflow: hidden;
  display: grid;
  place-items: center;
  font-size: 19px;

  /* The picture covers the glyph rather than replacing it, so the glyph is
     what shows while the picture loads and what is left if it never does. */
  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const items = css`
  display: flex;
  flex-direction: column;
  gap: 8px;

  .item {
    border-left: 2px solid var(--accent);
    padding-left: 10px;
  }

  .item .name {
    font-size: 13.5px;
  }

  .item .desc {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.6;
  }
`;

export const empty = css`
  color: var(--muted);
  font-size: 13px;
`;

/** The log is the game: everything the player has read stays in it. */
export const log = css`
  min-height: 260px;

  .entry {
    margin: 0 0 16px;
  }

  .entry:last-child {
    margin-bottom: 0;
  }

  .entry.said {
    border-top: 1px solid var(--line);
    padding-top: 14px;
  }

  .entry p {
    margin: 0 0 4px;
  }

  .entry.miss p {
    color: var(--muted);
    font-style: italic;
  }

  .typed {
    font-family: var(--ui);
    font-size: 13px;
    color: var(--accent);
    margin: 0 0 6px;
  }

  .did {
    font-size: 12.5px;
    color: var(--muted);
    font-family: var(--ui);
    margin: 0 0 6px;
  }

  .speaker {
    display: flex;
    gap: 8px;
    align-items: center;
    margin: 0 0 6px;
  }

  .speaker .who {
    font-size: 12.5px;
    color: var(--muted);
    font-family: var(--ui);
  }

  .found {
    display: inline-block;
    font-family: var(--ui);
    font-size: 12px;
    border: 1px solid var(--accent);
    color: var(--accent);
    border-radius: 999px;
    padding: 1px 10px;
    margin-top: 4px;
  }

  .moved {
    font-family: var(--ui);
    font-size: 12px;
    color: var(--muted);
    letter-spacing: 0.06em;
  }

  /* The room the player just walked into, set apart from what they did to
     get there: the log reads as narration, and this is the stage direction. */
  .arrival {
    border-left: 2px solid var(--line);
    padding-left: 12px;
    margin-top: 8px;
  }

  .arrival p {
    color: var(--muted);
  }

  /* The detective thinking aloud, unprompted. It follows the turn that set it
     off but is not part of it, so it sits apart and reads as an aside. */
  .interlude {
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px dashed var(--line);
  }

  .interlude p {
    font-style: italic;
  }

  /* An element of the truth the player did not reach. It is counted and left
     unnamed: naming it here would hand over the part of the case they were
     still working on. */
  .score .veiled {
    color: var(--muted);
    font-style: italic;
  }

  h3 {
    font-size: 19px;
    margin: 0 0 10px;
  }

  /* An ending the case counts as a win. The log is otherwise deliberately
     flat — every turn looks like every other turn — so the one place worth
     breaking that is the one the player played for. */
  .entry.won {
    border-top: 2px solid var(--accent);
    padding-top: 18px;
  }

  .entry.won h3 {
    font-size: 23px;
    color: var(--accent);
  }

  .solved {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: var(--ui);
    font-size: 13px;
    letter-spacing: 0.22em;
    color: var(--accent);
    margin: 0 0 8px;
  }

  .solved::before,
  .solved::after {
    content: "";
    flex: 1 1 auto;
    height: 1px;
    background: var(--accent);
    opacity: 0.4;
  }

  /* The badge arrives rather than simply being there: the ending is read
     from the top down, and this is the line that answers the question the
     player has been holding. A player who has asked for less motion gets the
     same screen without it. */
  .entry.won .solved {
    animation: jev-solved 700ms ease-out both;
  }

  @keyframes jev-solved {
    from {
      opacity: 0;
      letter-spacing: 0.02em;
    }
    to {
      opacity: 1;
      letter-spacing: 0.22em;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .entry.won .solved {
      animation: none;
    }
  }

  .score {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 4px 10px;
    font-family: var(--ui);
    font-size: 13px;
    margin-top: 14px;
  }

  .score .mark {
    color: var(--accent);
  }

  .score .mark.no {
    color: var(--muted);
  }

  .coherence {
    margin-top: 12px;
    font-family: var(--ui);
    font-size: 13px;
    color: var(--muted);
  }

  .track {
    background: var(--bar);
    border-radius: 3px;
    height: 6px;
    margin: 6px 0;
  }

  .track > div {
    background: var(--accent);
    height: 6px;
    border-radius: 3px;
  }

  /* The result as it will be posted, shown before it is, so the player can
     see that it gives nothing away. */
  .share {
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px dashed var(--line);
  }

  .share pre {
    font-family: var(--ui);
    font-size: 13px;
    white-space: pre-wrap;
    color: var(--muted);
    margin: 0 0 10px;
  }

  .share .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
`;

export const control = css`
  form {
    display: flex;
    gap: 10px;
    margin-top: 4px;
  }

  form.stacked {
    display: block;
  }

  input[type="text"],
  textarea {
    font: inherit;
    flex: 1 1 auto;
    min-width: 0;
    padding: 9px 12px;
    border-radius: 8px;
    border: 1px solid var(--line);
    background: var(--card);
    color: var(--fg);
  }

  textarea {
    width: 100%;
    min-height: 130px;
    resize: vertical;
    line-height: 1.8;
  }

  .hint {
    font-size: 12px;
    color: var(--muted);
    font-family: var(--ui);
    margin: 8px 0 0;
  }

  .error {
    color: var(--warn);
    font-size: 13px;
    font-family: var(--ui);
    margin: 8px 0 0;
  }
`;

/**
 * The gathering offered a second time, beside the form.
 *
 * The banner at the top of the board is easy to scroll past once the player is
 * reading the log and typing, so the same button is repeated where their eyes
 * already are — with the line that the banner cannot carry: that taking it is
 * their choice and the questioning can go on.
 */
export const gather = css`
  border-top: 1px solid var(--line);
  margin-top: 12px;
  padding-top: 12px;

  .hint {
    margin: 6px 0 0;
  }
`;

/** The case's hints, revealed one at a time after a missed accusation. */
export const hints = css`
  margin-top: 16px;

  p {
    margin: 0 0 10px;
    font-size: 14px;
  }
`;

/** The one thing the game volunteers: the case is ready to be closed. */
export const banner = css`
  border: 1px solid var(--accent);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;

  p {
    margin: 0 0 10px;
    font-size: 14px;
  }
`;

export const picker = css`
  display: flex;
  flex-direction: column;
  gap: 12px;

  a {
    display: block;
    text-decoration: none;
    color: inherit;
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 16px 18px;
  }

  a:hover {
    border-color: var(--accent);
  }

  .title {
    font-size: 18px;
    margin: 0 0 4px;
  }

  .byline {
    color: var(--muted);
    font-size: 13px;
    margin: 0;
  }

  .hash {
    font-family: var(--ui);
    font-size: 12px;
    color: var(--accent);
    margin: 6px 0 0;
  }
`;

export const waiting = css`
  color: var(--muted);
  font-size: 13px;
  font-family: var(--ui);
  font-style: italic;
`;

/**
 * Names to put into the accusation without typing them. A name spelt wrong is
 * an accusation that misses, and that should be a matter of reasoning, not of
 * remembering which characters someone's name is written with.
 */
export const names = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 8px 0 0;
  font-family: var(--ui);
  font-size: 12px;
  color: var(--muted);

  button {
    font-size: 13px;
    padding: 2px 12px;
    border-radius: 999px;
  }
`;

/**
 * The notebook: a button in the corner, and the book it opens.
 *
 * The button stays put while the page scrolls under it, which is the whole
 * point of it. Beside a wide page the book opens over the corner and leaves the
 * rest of the page usable; on a phone it is a sheet over the page, with a
 * backdrop that closes it.
 */
export const notebook = css`
  .fab {
    position: fixed;
    right: max(16px, env(safe-area-inset-right));
    bottom: max(16px, env(safe-area-inset-bottom));
    z-index: 30;
    width: 72px;
    height: 72px;
    padding: 4px;
    border: none;
    border-radius: 50%;
    background: transparent;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.35));
    transition: transform 120ms ease-out, opacity 120ms ease-out;
  }

  .fab:hover {
    transform: translateY(-2px);
  }

  .fab:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .fab img {
    display: block;
    width: 64px;
    height: 64px;
  }

  .fab.gone {
    opacity: 0;
    pointer-events: none;
  }

  .badge {
    position: absolute;
    top: 0;
    right: 0;
    min-width: 22px;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--warn);
    color: #fff;
    font: 600 12px/22px var(--ui);
    text-align: center;
  }

  .backdrop {
    display: none;
  }

  .book {
    position: fixed;
    right: max(16px, env(safe-area-inset-right));
    bottom: calc(max(16px, env(safe-area-inset-bottom)) + 84px);
    z-index: 31;
    width: 380px;
    max-height: min(70vh, 640px);
    display: flex;
    flex-direction: column;
    padding: 7px;
    border-radius: 14px;
    background: var(--leather);
    /* The stitching around the cover. */
    outline: 1.5px dashed var(--stitch);
    outline-offset: -4px;
    box-shadow: 0 14px 40px rgba(0, 0, 0, 0.35);
    color: var(--ink);
    font-size: 14px;
  }

  .book:focus {
    outline: 1.5px dashed var(--stitch);
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2px 6px 6px 10px;
  }

  h2 {
    margin: 0;
    font-size: 14px;
    letter-spacing: 0.3em;
    color: var(--stitch);
    font-family: var(--ui);
  }

  .close {
    padding: 0 10px;
    border: none;
    background: transparent;
    color: var(--stitch);
    font-size: 20px;
    line-height: 1.4;
  }

  .tabs {
    display: flex;
    gap: 4px;
    padding: 0 6px;
  }

  .tab {
    flex: 1 1 0;
    padding: 5px 4px;
    border: none;
    border-radius: 8px 8px 0 0;
    background: var(--paper-edge);
    color: var(--ink-muted);
    font-size: 13px;
  }

  .tab.on {
    background: var(--paper);
    color: var(--ink);
    font-weight: 600;
  }

  .page {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 12px 14px 14px;
    border-radius: 8px;
    background: var(--paper);
    /* The red rule across the top of the page. */
    box-shadow: inset 0 3px 0 var(--rule);
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .row {
    display: flex;
    gap: 10px;
    align-items: center;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--paper-edge);
  }

  .row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  /* The faces are what a player knows these people by, so the notebook
     draws them larger than the room panel does. */
  .row .${avatar} {
    width: 48px;
    height: 48px;
  }

  .body {
    flex: 1 1 auto;
    min-width: 0;
  }

  .name {
    font-size: 14.5px;
    line-height: 1.5;
  }

  .desc {
    margin: 0;
    font-size: 12.5px;
    line-height: 1.6;
    color: var(--ink-muted);
  }

  .here,
  .victim,
  .new {
    margin-left: 8px;
    padding: 0 7px;
    border-radius: 999px;
    font: 11px/18px var(--ui);
    vertical-align: 1px;
  }

  .here {
    border: 1px solid var(--accent);
    color: var(--accent);
  }

  .victim {
    border: 1px solid var(--ink-muted);
    color: var(--ink-muted);
  }

  .new {
    background: var(--warn);
    color: #fff;
  }

  .copy {
    flex: 0 0 auto;
    /* Wide enough for either label, so the row does not shift on a copy. */
    min-width: 7.5em;
    padding: 3px 10px;
    border: 1px solid var(--leather-ink);
    background: transparent;
    color: var(--leather-ink);
    font-size: 12.5px;
  }

  .copy.done {
    border-color: var(--accent);
    color: var(--accent);
  }

  .scene {
    margin: 0;
    font-size: 16px;
  }

  .present {
    margin: 6px 0 0;
    font-size: 13px;
  }

  .none,
  .tip {
    margin: 0;
    font-size: 12.5px;
    color: var(--ink-muted);
    font-family: var(--ui);
  }

  .tip {
    margin-top: 12px;
  }

  @media (max-width: 720px) {
    .fab.opened {
      opacity: 0;
      pointer-events: none;
    }

    .backdrop {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 31;
      background: rgba(0, 0, 0, 0.45);
    }

    .book {
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 32;
      width: auto;
      max-height: 82vh;
      max-height: 82dvh;
      padding: 8px 8px max(8px, env(safe-area-inset-bottom));
      border-radius: 16px 16px 0 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .fab {
      transition: none;
    }

    .fab:hover {
      transform: none;
    }
  }
`;
