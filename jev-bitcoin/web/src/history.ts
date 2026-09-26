/**
 * The reader's own history of questions, kept in this browser only.
 *
 * It lives in localStorage and never leaves the device: the service keeps no
 * record of who asked what, and this list is for the reader, not for us.
 * Storage can be unavailable (a private window, blocked site data), so every
 * access is guarded and the page works the same without it — the list simply
 * starts empty each time.
 */
import { signal } from "@kanabun/core";

export interface Asked {
  /** What the reader typed. */
  q: string;
  /** When, in milliseconds since the epoch. */
  at: number;
  /** The prepared question it landed on, once there is one. */
  id?: string;
  title?: string;
  /** How it was answered: answer, suggest, miss or multiple. */
  status?: string;
}

const KEY = "jev-bitcoin:history";
const LIMIT = 50;

/**
 * How close together two asks have to be for the second to be a revision of
 * the first. The page asks by itself whenever typing pauses, so writing one
 * question can ask "ビットコインって" and then "ビットコインって何？"; only the
 * last one is what the reader meant to ask.
 */
const REVISION_MS = 60_000;

function load(): Asked[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw === null ? [] : (JSON.parse(raw) as Asked[]);
    return Array.isArray(list) ? list.filter((e) => typeof e?.q === "string") : [];
  } catch {
    return [];
  }
}

function save(list: Asked[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // A full or blocked storage only costs the history.
  }
}

/** Newest first. */
export const history = signal<Asked[]>(load());

/**
 * Record an ask. A question that continues or trims the one just asked,
 * within a minute, replaces it instead of adding a line.
 */
export function record(q: string, status: string, id?: string, title?: string) {
  const now = Date.now();
  history.update((list) => {
    const last = list[0];
    const revises =
      last !== undefined && now - last.at < REVISION_MS && (q.startsWith(last.q) || last.q.startsWith(q));
    const entry: Asked = { q, at: now, id, title, status };
    const next = [entry, ...(revises ? list.slice(1) : list)].slice(0, LIMIT);
    save(next);
    return next;
  });
}

/**
 * Attach an answer to the latest question that did not get one — the reader
 * asked, got "もしかして", and picked one. Only then: a message that asked
 * several things is not answered by the one close question picked from it.
 */
export function resolveLatest(id: string, title: string) {
  history.update((list) => {
    const last = list[0];
    if (last === undefined || last.status !== "suggest" || last.id !== undefined) return list;
    if (Date.now() - last.at > REVISION_MS * 5) return list;
    const next = [{ ...last, id, title }, ...list.slice(1)];
    save(next);
    return next;
  });
}

export function clear() {
  history.set([]);
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing was saved, then.
  }
}
