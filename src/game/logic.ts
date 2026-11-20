// Pure Chowka Bhara rules. No React, no timers — everything here is unit tested.

export type Color = "red" | "green" | "blue" | "white";

/** Seats in anticlockwise turn order: bottom, right, top, left. */
export const SEAT_ORDER: Color[] = ["red", "green", "blue", "white"];

export const COLOR_NAMES: Record<Color, string> = {
  red: "Red",
  green: "Green",
  blue: "Blue",
  white: "White",
};

export const PAWNS_PER_PLAYER = 4;
export const HOME = -1;
export const INNER_START = 16; // first inner-ring index on a player's path
export const FINISH = 24; // centre cell index
export const SHELL_COUNT = 4;

export type Cell = readonly [row: number, col: number];

// Red sits at the bottom. 16 outer cells anticlockwise, 8 inner cells, then the centre.
const RED_PATH: Cell[] = [
  [4, 2], [4, 3], [4, 4], [3, 4], [2, 4], [1, 4], [0, 4], [0, 3],
  [0, 2], [0, 1], [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [4, 1],
  [3, 1], [2, 1], [1, 1], [1, 2], [1, 3], [2, 3], [3, 3], [3, 2],
  [2, 2],
];

/** Rotate a cell a quarter-turn anticlockwise around the centre, `times` times. */
function rotate([r, c]: Cell, times: number): Cell {
  let dr = r - 2;
  let dc = c - 2;
  for (let i = 0; i < times; i++) [dr, dc] = [-dc, dr];
  return [dr + 2, dc + 2];
}

export const PATHS: Record<Color, Cell[]> = Object.fromEntries(
  SEAT_ORDER.map((color, seat) => [color, RED_PATH.map((cell) => rotate(cell, seat))]),
) as Record<Color, Cell[]>;

const SAFE = new Set(["0,2", "4,2", "2,0", "2,4", "2,2"]);
export const cellKey = ([r, c]: Cell) => `${r},${c}`;
export const isSafeCell = (cell: Cell) => SAFE.has(cellKey(cell));

export function startCell(color: Color): Cell {
  return PATHS[color][0]!;
}

/** Board cell of a pawn, or null when it is still at home. */
export function cellOf(color: Color, pos: number): Cell | null {
  if (pos < 0 || pos > FINISH) return null;
  return PATHS[color][pos] ?? null;
}

export interface GameState {
  players: Color[];
  pawns: Record<Color, number[]>;
  hasCaptured: Record<Color, boolean>;
  turn: number; // index into players
}

export interface Move {
  pawn: number;
  from: number;
  to: number;
}

export function playersFor(count: number): Color[] {
  if (count <= 2) return ["red", "blue"];
  if (count === 3) return ["red", "green", "blue"];
  return [...SEAT_ORDER];
}

export function createGame(playerCount: number): GameState {
  const players = playersFor(playerCount);
  const pawns = {} as Record<Color, number[]>;
  const hasCaptured = {} as Record<Color, boolean>;
  for (const color of SEAT_ORDER) {
    pawns[color] = players.includes(color) ? Array(PAWNS_PER_PLAYER).fill(HOME) : [];
    hasCaptured[color] = false;
  }
  return { players, pawns, hasCaptured, turn: 0 };
}

export function currentColor(state: GameState): Color {
  return state.players[state.turn]!;
}

/** Roll value from the number of shells that landed face up (0 up counts as 8). */
export function rollValue(faceUp: number): number {
  return faceUp === 0 ? 8 : faceUp;
}

export function throwShells(random: () => number = Math.random): boolean[] {
  return Array.from({ length: SHELL_COUNT }, () => random() < 0.5);
}

export function rollFromShells(shells: boolean[]): number {
  return rollValue(shells.filter(Boolean).length);
}

/** 4 and 8 give another throw and are the only rolls that bring a pawn out. */
export const grantsExtraTurn = (roll: number) => roll === 4 || roll === 8;
export const canLeaveHome = (roll: number) => roll === 4 || roll === 8;

export function legalMoves(
  state: GameState,
  roll: number,
  options: { ignoreCaptureRule?: boolean } = {},
): Move[] {
  const color = currentColor(state);
  const unlocked = state.hasCaptured[color] || options.ignoreCaptureRule === true;
  const moves: Move[] = [];
  state.pawns[color].forEach((from, pawn) => {
    if (from === FINISH) return;
    if (from === HOME) {
      if (canLeaveHome(roll)) moves.push({ pawn, from, to: 0 });
      return;
    }
    const to = from + roll;
    if (to > FINISH) return; // exact roll needed for the centre
    if (!unlocked && to >= INNER_START) return; // must capture before the inner ring
    moves.push({ pawn, from, to });
  });
  return moves;
}

/** Pawns on the same square (or all at home) are interchangeable: keep one move per origin. */
export function uniqueMoves(moves: Move[]): Move[] {
  const seen = new Set<number>();
  return moves.filter((m) => (seen.has(m.from) ? false : (seen.add(m.from), true)));
}

/** True when the capture-first rule is what stops some move this roll. */
export function blockedByCaptureRule(state: GameState, roll: number): boolean {
  return legalMoves(state, roll, { ignoreCaptureRule: true }).length > legalMoves(state, roll).length;
}

export function setPawn(state: GameState, color: Color, pawn: number, pos: number): GameState {
  const list = [...state.pawns[color]];
  list[pawn] = pos;
  return { ...state, pawns: { ...state.pawns, [color]: list } };
}

export interface MoveResult {
  state: GameState;
  captured: Color[]; // one entry per pawn sent home
  firstCapture: boolean;
  won: boolean;
}

export function applyMove(state: GameState, move: Move): MoveResult {
  const color = currentColor(state);
  let next = setPawn(state, color, move.pawn, move.to);
  const captured: Color[] = [];
  const landing = cellOf(color, move.to);

  if (landing && !isSafeCell(landing)) {
    const key = cellKey(landing);
    for (const other of state.players) {
      if (other === color) continue;
      const list = next.pawns[other].map((pos) => {
        const cell = cellOf(other, pos);
        if (cell && cellKey(cell) === key) {
          captured.push(other);
          return HOME;
        }
        return pos;
      });
      next = { ...next, pawns: { ...next.pawns, [other]: list } };
    }
  }

  const firstCapture = captured.length > 0 && !state.hasCaptured[color];
  if (captured.length > 0) next = { ...next, hasCaptured: { ...next.hasCaptured, [color]: true } };
  const won = next.pawns[color].every((pos) => pos === FINISH);
  return { state: next, captured, firstCapture, won };
}

export function nextTurn(state: GameState): GameState {
  return { ...state, turn: (state.turn + 1) % state.players.length };
}

export const finishedCount = (state: GameState, color: Color) =>
  state.pawns[color].filter((p) => p === FINISH).length;
export const waitingCount = (state: GameState, color: Color) =>
  state.pawns[color].filter((p) => p === HOME).length;
