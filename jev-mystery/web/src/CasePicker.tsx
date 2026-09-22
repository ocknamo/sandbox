/**
 * The list of cases, which is the route at `#`.
 *
 * The links are plain anchors rather than `<Link>`: setting the hash directly
 * keeps the URL at `#clockwork` instead of the router's `#/clockwork`, and the
 * hash source listens for `hashchange`, so the router follows either way.
 */
import { For, Show, resource } from "@kanabun/core";
import * as api from "./api";
import * as s from "./styles";

export function CasePicker() {
  const [cases] = resource(() => api.listCases());

  // One element at the root, not a fragment. A fragment hands `<Routes>` an
  // array whose `<Show>` thunks are then read inside the router's own effect,
  // so every signal they touch re-runs the route — which re-creates the
  // component, re-runs its resource, and loops. An element root gives each
  // thunk its own effect.
  return (
    <div>
      <div class="titlebar">
        <div>
          <h1>事件簿</h1>
          <p class="byline">選択肢は表示されません。やりたいことを文章で書いてください。</p>
        </div>
      </div>

      <Show when={() => cases.loading()}>
        <p class={s.waiting}>……</p>
      </Show>

      <Show when={() => cases.error() !== undefined}>
        <div class={s.card}>
          <p>事件の一覧を読み込めませんでした。</p>
          <p class={s.empty}>{() => String(cases.error())}</p>
        </div>
      </Show>

      <div class={s.picker}>
        <For each={() => cases()?.cases ?? []}>
          {(entry: api.CaseSummary) => (
            <a href={`#${entry.id}`}>
              <p class="title">{entry.title}</p>
              <Show when={() => entry.byline !== undefined}>
                <p class="byline">{entry.byline}</p>
              </Show>
              <p class="hash">{`#${entry.id}`}</p>
            </a>
          )}
        </For>
      </div>
    </div>
  );
}
