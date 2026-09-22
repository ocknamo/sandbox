/**
 * The app: a router over the cases, and nothing else.
 *
 * The route lives in the URL hash, which browsers never send to a server, so
 * `#clockwork` is a deep link that survives a refresh on GitHub Pages with no
 * rewrite rules at all.
 */
import { render } from "@kanabun/core";
import { Route, Router, Routes, createHashSource } from "@kanabun/router";
import { CasePicker } from "./CasePicker";
import { Game } from "./Game";
import { API } from "./api";
import * as s from "./styles";

/**
 * The shell. It is a thunk under `<Router>` on purpose: kanabun has no
 * compiler, so a Provider's children must be a function to run *after* the
 * value is set. Plain JSX children are built first and would only see the
 * default — which is how `<Route> must be used inside a <Router>` happens.
 */
function Shell() {
  return (
      <main class={s.shell}>
        <Routes>
          <Route path="/" component={CasePicker} />
          <Route path="/:case" component={Game} />
        </Routes>
        <footer>
          <a href="#">事件簿</a>
          {" ・ "}
          <span>{API}</span>
          {" ・ ソースは "}
          <a href="https://github.com/ocknamo/sandbox/tree/main/jev-mystery">jev-mystery</a>
          {"。入力の解釈と推理の採点に "}
          <a href="https://docs.typesafe.ai/introduction">Jev</a>
          {" を使っています。"}
        </footer>
      </main>
  );
}

function App() {
  return <Router source={createHashSource()}>{() => <Shell />}</Router>;
}

const root = document.getElementById("app");
if (root) render(() => <App />, root);
