/**
 * The owl who answers. It is drawn inline rather than loaded, so it is there
 * on the first paint and costs no request.
 *
 * Its mood is the only animation on the page, and it carries information: the
 * owl tilts its head and looks up while a question is being read, perks up
 * when it has an answer, and cocks its head when it has none. A reader who
 * typed and paused sees at once that something is happening.
 */
import * as s from "./styles";

export type Mood = "idle" | "thinking" | "answer" | "suggest" | "miss";

/** What the owl says over its head, per mood. */
export const lines: Record<Mood, string> = {
  idle: "ビットコインのこと、なんでも聞いてください。",
  thinking: "ふむふむ……",
  answer: "お答えします。",
  suggest: "もしかして、これのことでしょうか？",
  miss: "うーん、それはまだ勉強中です。",
};

/**
 * The drawing. kanabun creates every element with `document.createElement`,
 * which puts `<svg>` and its children in the HTML namespace, where they are
 * unknown elements and draw nothing. So the drawing is a fixed string set as
 * markup. It is the page's own constant, never anything a reader typed, which
 * is what makes `innerHTML` safe here.
 *
 * The classes inside it — bird, pupils, lid — are what the moods animate.
 */
const drawing = `<svg viewBox="0 0 200 210" role="img" aria-label="フクロウ">
  <rect x="18" y="186" width="164" height="12" rx="6" fill="#7a4e2d" />

  <g class="bird">
    <path d="M52 52 L44 16 L78 40 Z" fill="#6f4a2f" />
    <path d="M148 52 L156 16 L122 40 Z" fill="#6f4a2f" />
    <ellipse cx="100" cy="112" rx="66" ry="76" fill="#8a5d3b" />
    <ellipse cx="42" cy="128" rx="16" ry="40" fill="#6f4a2f" transform="rotate(12 42 128)" />
    <ellipse cx="158" cy="128" rx="16" ry="40" fill="#6f4a2f" transform="rotate(-12 158 128)" />
    <ellipse cx="100" cy="138" rx="42" ry="44" fill="#ecd6b3" />
    <path
      d="M76 126 q6 -6 12 0 q6 -6 12 0 q6 -6 12 0 q6 -6 12 0 M70 142 q6 -6 12 0 q6 -6 12 0 q6 -6 12 0 q6 -6 12 0 q6 -6 12 0"
      fill="none"
      stroke="#d7b98e"
      stroke-width="2"
      stroke-linecap="round"
    />
    <circle cx="100" cy="162" r="11" fill="#f7931a" />
    <text x="100" y="167" text-anchor="middle" font-size="14" font-weight="700" fill="#ffffff">
      ₿
    </text>
    <circle cx="72" cy="86" r="28" fill="#f6ead7" />
    <circle cx="128" cy="86" r="28" fill="#f6ead7" />
    <g class="pupils">
      <circle cx="72" cy="88" r="13" fill="#2b1d12" />
      <circle cx="128" cy="88" r="13" fill="#2b1d12" />
      <circle cx="76" cy="83" r="4" fill="#ffffff" />
      <circle cx="132" cy="83" r="4" fill="#ffffff" />
    </g>
    <ellipse class="lid" cx="72" cy="86" rx="29" ry="29" fill="#8a5d3b" />
    <ellipse class="lid" cx="128" cy="86" rx="29" ry="29" fill="#8a5d3b" />
    <path d="M92 104 L108 104 L100 120 Z" fill="#f2a33a" />
  </g>
  <path d="M78 184 l-6 8 M84 184 v9 M90 184 l6 8" stroke="#f2a33a" stroke-width="4" stroke-linecap="round" />
  <path d="M110 184 l-6 8 M116 184 v9 M122 184 l6 8" stroke="#f2a33a" stroke-width="4" stroke-linecap="round" />
</svg>`;

export function Owl(props: { mood: () => Mood }) {
  return (
    <div class={() => `${s.owl} ${props.mood()}`}>
      <p class="bubble" aria-live="polite">
        {() => lines[props.mood()]}
      </p>
      <div class="drawing" ref={(el: Element) => (el.innerHTML = drawing)} />
    </div>
  );
}
