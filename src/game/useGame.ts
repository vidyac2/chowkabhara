import { useEffect, useRef, useState } from "react";
import {
  COLOR_NAMES,
  FINISH,
  HOME,
  applyMove,
  blockedByCaptureRule,
  createGame,
  currentColor,
  grantsExtraTurn,
  legalMoves,
  nextTurn,
  rollFromShells,
  setPawn,
  throwShells,
  uniqueMoves,
  type Color,
  type GameState,
  type Move,
} from "./logic";
import { sfx } from "./sound";

export type Phase = "roll" | "rolling" | "move" | "passing" | "animating" | "won";

export interface PlayState {
  game: GameState;
  phase: Phase;
  roll: number | null;
  shells: boolean[];
  message: string;
  legal: Move[];
  winner: Color | null;
  shake: boolean;
}

const STEP_MS = 170;
const ROLL_MS = 900;

const name = (c: Color) => COLOR_NAMES[c];

function initial(players: number): PlayState {
  const game = createGame(players);
  return {
    game,
    phase: "roll",
    roll: null,
    shells: [true, false, true, false],
    message: `${name(currentColor(game))} goes first. Throw the shells!`,
    legal: [],
    winner: null,
    shake: false,
  };
}

function describeCaptures(captured: Color[]): string {
  const counts = new Map<Color, number>();
  captured.forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1));
  return [...counts]
    .map(([c, n]) => (n === 1 ? `${name(c)}'s pawn` : `${n} of ${name(c)}'s pawns`))
    .join(" and ");
}

export function useGame(players: number) {
  const [ui, setUi] = useState<PlayState>(() => initial(players));
  const ref = useRef(ui);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const update = (fn: (s: PlayState) => PlayState) => {
    ref.current = fn(ref.current);
    setUi(ref.current);
  };
  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const finishTurn = (game: GameState, extra: boolean, prefix: string) => {
    const lead = prefix ? `${prefix} ` : "";
    if (extra) {
      const who = name(currentColor(game));
      update((s) => ({ ...s, game, phase: "roll", legal: [], message: `${lead}${who} throws again.` }));
    } else {
      const next = nextTurn(game);
      const who = name(currentColor(next));
      update((s) => ({ ...s, game: next, phase: "roll", legal: [], message: `${lead}${who}'s turn.` }));
    }
  };

  const resolve = (base: GameState, move: Move, roll: number) => {
    const color = currentColor(base);
    const who = name(color);
    const result = applyMove(base, move);
    let msg: string;
    if (result.captured.length > 0) {
      sfx.capture();
      msg = `${who} captured ${describeCaptures(result.captured)}!`;
      if (result.firstCapture) msg += " Inner ring unlocked.";
      update((s) => ({ ...s, shake: true }));
      later(() => update((s) => ({ ...s, shake: false })), 450);
    } else if (move.to === FINISH) {
      sfx.finish();
      msg = `${who}'s pawn reached the centre!`;
    } else if (move.from === HOME) {
      msg = `${who} brought a pawn out.`;
    } else {
      msg = `${who} moved ${roll}.`;
    }

    if (result.won) {
      sfx.win();
      update((s) => ({
        ...s,
        game: result.state,
        phase: "won",
        winner: color,
        legal: [],
        message: `${who} wins the game!`,
      }));
      return;
    }
    finishTurn(result.state, grantsExtraTurn(roll) || result.captured.length > 0, msg);
  };

  const choose = (from: number) => {
    const s = ref.current;
    if (s.phase !== "move" || s.roll === null) return;
    const move = s.legal.find((m) => m.from === from);
    if (!move) return;
    const roll = s.roll;
    const color = currentColor(s.game);
    const base = s.game;
    const steps: number[] = [];
    if (move.from === HOME) steps.push(0);
    else for (let p = move.from + 1; p <= move.to; p++) steps.push(p);

    update((st) => ({ ...st, phase: "animating", legal: [] }));
    steps.forEach((pos, i) =>
      later(() => {
        update((st) => ({ ...st, game: setPawn(st.game, color, move.pawn, pos) }));
        sfx.step(i);
      }, i * STEP_MS),
    );
    later(() => resolve(base, move, roll), steps.length * STEP_MS + 120);
  };

  const roll = () => {
    if (ref.current.phase !== "roll") return;
    const who = name(currentColor(ref.current.game));
    sfx.roll();
    update((s) => ({ ...s, phase: "rolling", legal: [], message: `${who} throws the shells…` }));

    later(() => {
      const shells = throwShells();
      const value = rollFromShells(shells);
      const s = ref.current;
      const moves = legalMoves(s.game, value);
      const options = uniqueMoves(moves);
      const extra = grantsExtraTurn(value);
      sfx.land();

      if (options.length === 0) {
        const why = blockedByCaptureRule(s.game, value)
          ? "capture a pawn first to enter the inner ring"
          : "no move possible";
        update((st) => ({
          ...st,
          phase: "passing",
          roll: value,
          shells,
          legal: [],
          message: `${who} rolled ${value} — ${why}.`,
        }));
        later(() => finishTurn(ref.current.game, extra, ""), 1500);
        return;
      }

      const hint = options.length === 1 ? "" : " Tap a glowing pawn.";
      update((st) => ({
        ...st,
        phase: "move",
        roll: value,
        shells,
        legal: moves,
        message: `${who} rolled ${value}.${extra ? " Extra throw!" : ""}${hint}`,
      }));
      const only = options[0];
      if (options.length === 1 && only) later(() => choose(only.from), 700);
    }, ROLL_MS);
  };

  return { ui, roll, choose };
}
