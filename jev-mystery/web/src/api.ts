/**
 * The service's side of the game, as types.
 *
 * Everything here is what the player has earned: the prose for what just
 * happened, where they are standing, what they are holding. The list of things
 * they could have typed is not in this file because it is never sent — being
 * unable to see it is the game.
 */

const DEPLOYED_API = "https://jev-mystery-api-329294726644.asia-northeast1.run.app";

/** The service to talk to. `?api=` points the page at a local server. */
export const API = (new URLSearchParams(location.search).get("api") ?? DEPLOYED_API).replace(/\/+$/, "");

/** One case, as the picker lists it. A title is not a spoiler. */
export interface CaseSummary {
  id: string;
  title: string;
  byline?: string;
}

export interface Scene {
  id: string;
  name: string;
  description: string[];
}

/** Who is in the room. The one hint the game gives for free. */
export interface Person {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
}

export interface View {
  scene: Scene;
  people?: Person[];
  evidence?: Item[];
  turn: number;
  finished: boolean;
  finale_open: boolean;
  finale_label?: string;
  suspects?: string[];
}

export interface Start {
  state: string;
  title: string;
  byline?: string;
  opening: string[];
  incident: string[];
  /** The room the case opens in, described. */
  arrival?: string[];
  view: View;
}

export interface Turn {
  state: string;
  matched: boolean;
  did?: string;
  speaker?: Person;
  text: string[];
  gained?: Item[];
  moved_to?: string;
  /** The room just walked into, described. Only on a turn that moved. */
  arrival?: string[];
  finale?: boolean;
  view: View;
}

/**
 * One element of the truth, as the scorecard grades it.
 *
 * The label of an element the player did not reach is a spoiler — it names
 * the part of the case they were still working on — so the page counts those
 * and does not print them. The service sends the labels either way; the case
 * is over, and the line that matters is the one drawn at the screen.
 */
export interface Point {
  label: string;
  hit: boolean;
}

export interface Verdict {
  state: string;
  ending_id: string;
  title: string;
  text: string[];
  correct: boolean;
  named_name?: string;
  points: Point[];
  coherence: number;
  coherence_top: number;
  coherence_legend?: string;
}

async function request<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(API + path, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { message?: string };
  if (!res.ok) throw new Error(data.message ?? `${res.status}`);
  return data as T;
}

export const listCases = () => request<{ cases: CaseSummary[] }>("/api/cases");
export const newGame = (id: string) => request<Start>("/api/new", { case: id });
export const act = (state: string, input: string) => request<Turn>("/api/act", { state, input });
export const accuse = (state: string, answer: string) => request<Verdict>("/api/accuse", { state, answer });
