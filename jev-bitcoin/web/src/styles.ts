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
  max-width: 680px;
  margin: 0 auto;
  padding: 32px 16px 56px;

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

  h1 a.home {
    color: inherit;
    text-decoration: none;
  }

  .byline {
    color: var(--muted);
    font-size: 13px;
    margin: 2px 0 20px;
  }

  footer {
    color: var(--muted);
    font-size: 12px;
    margin-top: 40px;
    text-align: center;
    overflow-wrap: anywhere;
  }

  footer a {
    color: inherit;
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
  }
`;

/** One answer: the question it answers, then the prepared answer. */
export const answer = css`
  .meta {
    display: flex;
    gap: 10px;
    font-size: 12px;
    color: var(--muted);
    margin: 0;
  }

  .meta a {
    color: var(--muted);
    text-decoration: none;
  }

  h3 {
    font-size: 17px;
    line-height: 1.5;
    margin: 2px 0 8px;
  }

  .prose p {
    margin: 0 0 10px;
    white-space: pre-line;
  }

  .pending {
    color: var(--muted);
    font-style: italic;
    margin: 0 0 6px;
  }

  details {
    margin: 4px 0 8px;
    border-left: 2px solid var(--line);
    padding-left: 12px;
  }

  summary {
    cursor: pointer;
    color: var(--accent);
    font-size: 13.5px;
    margin-bottom: 6px;
  }

  .related {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    margin-top: 8px;
  }

  .label {
    font-size: 12px;
    color: var(--muted);
    margin-right: 2px;
  }

  .notes {
    margin: 10px 0 0;
    padding: 6px 12px 6px 28px;
    border-radius: 8px;
    background: var(--bg);
    font-size: 12.5px;
    color: var(--muted);
  }

  .notes li {
    margin: 1px 0;
  }

  .sources {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 10px;
    font-size: 12px;
    color: var(--muted);
    overflow-wrap: anywhere;
  }

  .sources a {
    color: var(--muted);
  }

  button.chip {
    font-size: 12.5px;
    padding: 3px 12px;
    border-radius: 999px;
    background: transparent;
    color: var(--accent);
    text-align: left;
  }
`;

export const suggestions = css`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-top: 8px;

  .label {
    font-size: 12px;
    color: var(--muted);
    margin-right: 2px;
  }

  button.chip {
    font-size: 12.5px;
    padding: 3px 12px;
    border-radius: 999px;
    background: transparent;
    color: var(--accent);
    text-align: left;
  }
`;

/**
 * The owl, large, with what it is saying above its head. The moods are classes
 * on the wrapper; the drawing itself never changes, only how it moves.
 */
export const owl = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 8px 0 4px;

  .bubble {
    position: relative;
    margin: 0 0 10px;
    padding: 8px 16px;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: var(--card);
    font-size: 14.5px;
    min-height: 1.85em;
    text-align: center;
  }

  .bubble::after {
    content: "";
    position: absolute;
    left: 50%;
    bottom: -7px;
    width: 12px;
    height: 12px;
    background: var(--card);
    border-right: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    transform: translateX(-50%) rotate(45deg);
  }

  svg {
    width: min(260px, 64vw);
    height: auto;
    display: block;
  }

  .bird,
  .pupils,
  .lid {
    transform-box: fill-box;
  }

  .bird {
    transform-origin: 50% 100%;
    transition: transform 0.3s ease;
  }

  .pupils {
    transition: transform 0.25s ease;
  }

  /* Keyframes are global in kanabun's css helper, hence the owl- prefix.
     The lids sit shut-flat until a blink opens them downward for a moment. */
  .lid {
    transform-origin: 50% 0%;
    transform: scaleY(0);
    animation: owl-blink 5s infinite;
  }

  &.thinking .bird {
    animation: owl-ponder 1.4s ease-in-out infinite;
  }

  &.thinking .pupils {
    transform: translate(3px, -6px);
  }

  &.answer .bird {
    animation: owl-hop 0.5s ease-out 1;
  }

  /* Listening: the owl leans in, eyes wide on the speaker. */
  &.listening .bird {
    transform: translateY(-4px) scale(1.03);
  }

  &.listening .pupils {
    transform: translateY(2px);
  }

  &.suggest .bird,
  &.miss .bird {
    transform: rotate(-8deg);
  }

  &.miss .pupils {
    transform: translate(-3px, 2px);
  }

  /* Several questions at once: the owl's eyes go round in circles. */
  &.multiple .bird {
    animation: owl-dizzy 0.9s ease-in-out 2;
  }

  &.multiple .pupils {
    animation: owl-roll 0.9s linear 2;
  }

  @keyframes owl-blink {
    0%, 94%, 100% { transform: scaleY(0); }
    97% { transform: scaleY(1); }
  }

  @keyframes owl-ponder {
    0%, 100% { transform: rotate(-6deg); }
    50% { transform: rotate(6deg); }
  }

  @keyframes owl-dizzy {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-9deg); }
    75% { transform: rotate(9deg); }
  }

  @keyframes owl-roll {
    0% { transform: translate(3px, 0); }
    25% { transform: translate(0, 3px); }
    50% { transform: translate(-3px, 0); }
    75% { transform: translate(0, -3px); }
    100% { transform: translate(3px, 0); }
  }

  @keyframes owl-hop {
    0% { transform: translateY(0); }
    40% { transform: translateY(-8px); }
    100% { transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .lid,
    &.thinking .bird,
    &.answer .bird,
    &.multiple .bird,
    &.multiple .pupils {
      animation: none;
    }
  }
`;

/**
 * The one field. No submit button: pausing is asking. The only button is the
 * microphone, sitting inside the field's right end.
 */
export const field = css`
  position: relative;
  margin: 0 0 20px;

  input {
    font: inherit;
    font-size: 17px;
    width: 100%;
    padding: 14px 58px 14px 18px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: var(--card);
    color: var(--fg);
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.06);
  }

  input:focus {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }

  button.mic {
    position: absolute;
    top: 50%;
    right: 7px;
    transform: translateY(-50%);
    width: 42px;
    height: 42px;
    padding: 0;
    display: grid;
    place-items: center;
    border-radius: 50%;
    border: 0;
    background: transparent;
    color: var(--muted);
  }

  button.mic:hover {
    color: var(--accent);
  }

  /* Listening: the button fills, and a ring pulses out of it, so it is plain
     from across the room that the page is taking sound. */
  button.mic.on {
    background: var(--accent);
    color: var(--on-accent);
    animation: mic-pulse 1.4s ease-out infinite;
  }

  @keyframes mic-pulse {
    0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 55%, transparent); }
    100% { box-shadow: 0 0 0 14px transparent; }
  }

  @media (prefers-reduced-motion: reduce) {
    button.mic.on {
      animation: none;
    }
  }
`;

export const voiceNote = css`
  font-size: 12px;
  color: var(--muted);
  text-align: center;
  margin: -10px 0 16px;
`;

/** Where the answer lands. It dims while a newer question is being read. */
export const reply = css`
  transition: opacity 0.2s ease;

  &.stale {
    opacity: 0.45;
  }

  .message p {
    margin: 0 0 4px;
    color: var(--muted);
  }
`;

/** The reader's own questions, folded away under the answer. */
export const history = css`
  margin-top: 28px;
  border-top: 1px solid var(--line);
  padding-top: 10px;

  summary {
    cursor: pointer;
    font-size: 13.5px;
    color: var(--muted);
  }

  ol {
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
  }

  li {
    display: flex;
    gap: 10px;
    align-items: baseline;
    border-bottom: 1px solid var(--line);
    padding: 6px 0;
  }

  li button {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--fg);
    text-align: left;
    cursor: pointer;
    font-size: 14px;
  }

  li button:hover .q {
    color: var(--accent);
  }

  .q {
    overflow-wrap: anywhere;
  }

  .a {
    font-size: 12px;
    color: var(--muted);
  }

  .at {
    flex: 0 0 auto;
    font-size: 11.5px;
    color: var(--muted);
  }

  .foot {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: var(--muted);
    margin: 8px 0 0;
  }

  button.clear {
    font-size: 12px;
    padding: 2px 10px;
    background: transparent;
    color: var(--muted);
    border-color: var(--line);
  }
`;

export const error = css`
  color: var(--warn);
  font-size: 13px;
  text-align: center;
  margin: -8px 0 16px;
`;
