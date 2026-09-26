/**
 * The page mounts one component. There is nothing to route between: the owl,
 * one field, and whatever it answered.
 */
import { render } from "@kanabun/core";
import { API } from "./api";
import { App } from "./App";
import * as s from "./styles";

function Shell() {
  return (
    <main class={s.shell}>
      <App />
      <footer>
        {"答えの文章はすべて人が書いたものです。質問の読み取りに "}
        <a href="https://docs.typesafe.ai/introduction">Jev</a>
        {" を使っています。売買の判断や価格の予想にはお答えしません。 ・ "}
        <a href="https://github.com/ocknamo/sandbox/tree/main/jev-bitcoin">ソース</a>
        {" ・ "}
        <span>{API}</span>
      </footer>
    </main>
  );
}

const root = document.getElementById("app");
if (root) render(() => <Shell />, root);
