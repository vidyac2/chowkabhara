// Pure turn engine: every step of a turn is a function PlayState -> PlayState.
// The React hook only decides *when* to call these (timers, clicks); it never edits state itself,
// so a stale timer or a double tap can never move a pawn twice or out of turn.
import {
  COLOR_NAMES,
  FINISH,
  HOME,
  SEAT_ORDER,
  applyMove,
  blockedByCaptureRule,
  cellKey,
  cellOf,
  createGame,
  currentColor,
  grantsExtraTurn,
  legalMoves,
  nextTurn,
  rollFromShells,
  setPawn,
  uniqueMoves,
  whyCannotMove,
  type Color,
  type GameState,
  type Move,
} from "./logic";

export type Phase = "roll" | "rolling" | "move" | "passing" | "animating" | "won";

export interface GameEvent {
  id: number;
  kind: "capture" | "finish" | "win" | "out" | "nope";
  color: Color;
  /** Board cell ("r,c") where it happened, for the capture burst. */
  cell?: string;
}

export interface Anim {
  color: Color;
  pawn: number;
  /** Positions the pawn visits, one per step. */
  path: number[];
  /** How many of `path` have been shown so far. */
  shown: number;
  move: Move;
  roll: number;
  /** Game state before the move, so captures are resolved once at the end. */
  base: GameState;
}

export interface PlayState {
  game: GameState;
  names: Record<Color, string>;
  phase: Phase;
  roll: number | null;
  shells: boolean[];
  throws: number;
  message: string;
  legal: Move[];
  winner: Color | null;
  anim: Anim | null;
  event: GameEvent | null;
}

export function defaultNames(): Record<Color, string> {
  return { ...COLOR_NAMES };
}

export function cleanNames(names: Partial<Record<Color, string>>): Record<Color, string> {
  const out = defaultNames();
  for (const c of SEAT_ORDER) {
    const n = names[c]?.trim().slice(0, 14);
    if (n) out[c] = n;
  }
  return out;
}

export function newPlay(playerCount: number, names: Partial<Record<Color, string>> = {}): PlayState {
  const game = createGame(playerCount);
  const clean = cleanNames(names);
  return {
    game,
    names: clean,
    phase: "roll",
    roll: null,
    shells: [true, false, true, false],
    throws: 0,
    message: `${clean[currentColor(game)]} goes first. Throw the shells!`,
    legal: [],
    winner: null,
    anim: null,
    event: null,
  };
}

const who = (s: PlayState, c: Color = currentColor(s.game)) => s.names[c];

function emit(s: PlayState, kind: GameEvent["kind"], color: Color, cell?: string): GameEvent {
  return { id: (s.event?.id ?? 0) + 1, kind, color, ...(cell ? { cell } : {}) };
}

function endTurn(s: PlayState, game: GameState, extra: boolean, lead: string): PlayState {
  const prefix = lead ? `${lead} ` : "";
  if (extra) {
    return { ...s, game, phase: "roll", legal: [], anim: null, message: `${prefix}${who(s, currentColor(game))} throws again.` };
  }
  const next = nextTurn(game);
  return { ...s, game: next, phase: "roll", legal: [], anim: null, message: `${prefix}${who(s, currentColor(next))}'s turn.` };
}

/** Distinct pawn choices this roll (pawns on the same square are interchangeable). */
export const choices = (s: PlayState) => uniqueMoves(s.legal);

/** Start throwing. Ignored unless it is a fresh throw for the current player. */
export function startRoll(s: PlayState): PlayState {
  if (s.phase !== "roll") return s;
  return { ...s, phase: "rolling", legal: [], message: `${who(s)} throws the shells…` };
}

/** The shells have landed: work out the roll and which pawns can use it. */
export function landRoll(s: PlayState, shells: boolean[]): PlayState {
  if (s.phase !== "rolling") return s;
  const value = rollFromShells(shells);
  const moves = legalMoves(s.game, value);
  const extra = grantsExtraTurn(value);
  const base = { ...s, roll: value, shells, throws: s.throws + 1 };

  if (moves.length === 0) {
    const why = blockedByCaptureRule(s.game, value)
      ? "capture a pawn first to enter the inner ring"
      : s.game.pawns[currentColor(s.game)].every((p) => p === HOME)
        ? "you need a 4 or an 8 to bring a pawn out"
        : "no move possible";
    return { ...base, phase: "passing", legal: [], message: `${who(s)} rolled ${value} — ${why}.` };
  }

  const hint = uniqueMoves(moves).length === 1 ? "" : " Tap a glowing pawn.";
  return {
    ...base,
    phase: "move",
    legal: moves,
    message: `${who(s)} rolled ${value}.${extra ? " Extra throw!" : ""}${hint}`,
  };
}

/** After a roll with no possible move, hand over (or throw again on a 4 / 8). */
export function passTurn(s: PlayState): PlayState {
  if (s.phase !== "passing" || s.roll === null) return s;
  return endTurn(s, s.game, grantsExtraTurn(s.roll), "");
}

/**
 * The player tapped one of their pawns at position `from` (HOME = -1).
 * A legal pick starts the step-by-step move; an illegal one explains why and changes nothing.
 */
export function choosePawn(s: PlayState, from: number): PlayState {
  if (s.phase !== "move" || s.roll === null) return s;
  const move = s.legal.find((m) => m.from === from);
  const color = currentColor(s.game);
  if (!move) {
    const why = whyCannotMove(s.game, from, s.roll) ?? "That pawn can't move this turn.";
    return { ...s, message: `${why} You rolled ${s.roll}.`, event: emit(s, "nope", color) };
  }
  const path: number[] = [];
  if (move.from === HOME) path.push(0);
  else for (let p = move.from + 1; p <= move.to; p++) path.push(p);
  return {
    ...s,
    phase: "animating",
    legal: [],
    anim: { color, pawn: move.pawn, path, shown: 0, move, roll: s.roll, base: s.game },
  };
}

/** Show the next step of the moving pawn; after the last step, resolve the move. */
export function advance(s: PlayState): PlayState {
  if (s.phase !== "animating" || !s.anim) return s;
  const a = s.anim;
  if (a.shown < a.path.length) {
    const pos = a.path[a.shown]!;
    return { ...s, game: setPawn(s.game, a.color, a.pawn, pos), anim: { ...a, shown: a.shown + 1 } };
  }
  return resolve(s);
}

function describeCaptures(s: PlayState, captured: Color[]): string {
  const counts = new Map<Color, number>();
  captured.forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1));
  return [...counts]
    .map(([c, n]) => (n === 1 ? `${who(s, c)}'s pawn` : `${n} of ${who(s, c)}'s pawns`))
    .join(" and ");
}

function resolve(s: PlayState): PlayState {
  const a = s.anim;
  if (!a) return s;
  const name = who(s, a.color);
  const result = applyMove(a.base, a.move);
  const landing = cellOf(a.color, a.move.to);
  let msg: string;
  let event: GameEvent | null = s.event;

  if (result.captured.length > 0) {
    msg = `${name} captured ${describeCaptures(s, result.captured)}!`;
    if (result.firstCapture) msg += " Inner ring unlocked.";
    event = emit(s, "capture", a.color, landing ? cellKey(landing) : undefined);
  } else if (a.move.to === FINISH) {
    msg = `${name}'s pawn reached the centre!`;
    event = emit(s, "finish", a.color);
  } else if (a.move.from === HOME) {
    msg = `${name} brought a pawn out.`;
    event = emit(s, "out", a.color);
  } else {
    msg = `${name} moved ${a.roll}.`;
  }

  if (result.won) {
    return {
      ...s,
      game: result.state,
      phase: "won",
      winner: a.color,
      legal: [],
      anim: null,
      message: `${name} wins the game!`,
      event: emit(s, "win", a.color),
    };
  }
  return endTurn({ ...s, event }, result.state, grantsExtraTurn(a.roll) || result.captured.length > 0, msg);
}

/** Finish anything in flight so the game can be saved and resumed at a clean point. */
export function settle(s: PlayState): PlayState {
  if (s.phase === "rolling") return { ...s, phase: "roll", message: `${who(s)}'s turn. Throw the shells!` };
  if (s.phase === "passing") return passTurn(s);
  if (s.phase === "animating") return resolve(s);
  return s;
}
