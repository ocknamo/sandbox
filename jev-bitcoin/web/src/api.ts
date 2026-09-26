/**
 * The service's side of the Q&A, as types.
 *
 * Only `ask` costs anything: it is the one call that reaches the model. Every
 * other way into an answer — a suggestion, a related question, a permalink —
 * looks it up by its number and is free.
 */

const DEPLOYED_API = "https://jev-bitcoin-api-329294726644.asia-northeast1.run.app";

/** The service to talk to. `?api=` points the page at a local server. */
export const API = (new URLSearchParams(location.search).get("api") ?? DEPLOYED_API).replace(/\/+$/, "");

export interface CategoryRef {
  id: string;
  name: string;
}

/** A prepared question, as a link to it. */
export interface Ref {
  /** The number from the question table, such as "1-7". Also the permalink. */
  id: string;
  title: string;
  category: CategoryRef;
  /** Whether anybody has written its answer yet. */
  answered: boolean;
}

/** A prepared question and its answer. */
export interface Entry extends Ref {
  /** The short answer. Empty while the answer is still being written. */
  answer: string[];
  /** What sits behind "もっと詳しく". */
  more?: string[];
  related?: Ref[];
  sources?: string[];
  /** The day the answer's facts were last checked. */
  updated?: string;
  /** What kind of fact the answer rests on: 時点依存, 研究提案, 誤前提, … */
  tags?: string[];
}

export interface Scored extends Ref {
  score: number;
}

export interface CategoryScore extends CategoryRef {
  p: number;
}

export interface Answer {
  status: "answer" | "suggest" | "miss" | "multiple";
  kind?: string;
  answer?: Entry;
  /** The question read as a technical one: start with the longer half open. */
  expand?: boolean;
  /** What to say instead of an answer. */
  message?: string[];
  /** Close calls, offered as "もしかして". */
  suggestions?: Scored[];
  /** The likeliest categories, for showing why. */
  categories: CategoryScore[];
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

export const ask = (question: string) => request<Answer>("/api/ask", { question });
export const entry = (id: string) => request<Entry>(`/api/faq/${encodeURIComponent(id)}`);
