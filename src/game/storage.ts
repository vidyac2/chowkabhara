// Saves the current match in the browser so a refresh or a closed tab never loses the game.
import { SEAT_ORDER, type Color } from "./logic";
import { newPlay, settle, type PlayState } from "./engine";

export interface Match {
  v: 1;
  id: string;
  playerCount: number;
  names: Record<Color, string>;
  /** Games won by each seat across "Play again" rounds. */
  wins: Record<Color, number>;
  play: PlayState;
  elapsedMs: number;
  savedAt: number;
}

const KEY = "chowka-bhara-match";
const LAST_NAMES = "chowka-bhara-names";

const emptyWins = () => Object.fromEntries(SEAT_ORDER.map((c) => [c, 0])) as Record<Color, number>;
const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export function createMatch(playerCount: number, names: Partial<Record<Color, string>>): Match {
  const play = newPlay(playerCount, names);
  return { v: 1, id: newId(), playerCount, names: play.names, wins: emptyWins(), play, elapsedMs: 0, savedAt: Date.now() };
}

/** Same players and win tally, fresh board. */
export function rematch(m: Match): Match {
  return { ...m, id: newId(), play: newPlay(m.playerCount, m.names), elapsedMs: 0, savedAt: Date.now() };
}

export function loadMatch(): Match | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const m = JSON.parse(raw) as Match;
    if (m.v !== 1 || !m.play?.game?.pawns || !Array.isArray(m.play.game.players)) return null;
    return { ...m, play: settle(m.play) };
  } catch {
    return null;
  }
}

export function saveMatch(m: Match) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...m, play: settle(m.play), savedAt: Date.now() }));
    window.localStorage.setItem(LAST_NAMES, JSON.stringify(m.names));
  } catch {
    // Storage blocked: the game still works, it just won't survive a refresh.
  }
}

export function clearMatch() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function lastNames(): Partial<Record<Color, string>> {
  try {
    return JSON.parse(window.localStorage.getItem(LAST_NAMES) ?? "{}") as Partial<Record<Color, string>>;
  } catch {
    return {};
  }
}

export function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(h ? 2 : 1, "0");
  return `${h ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}
