import { useEffect, useRef, useState } from "react";
import { advance, choices, choosePawn, landRoll, passTurn, startRoll, type PlayState } from "./engine";
import { throwShells } from "./logic";
import { STEP_MS, type Settings } from "./settings";
import { sfx } from "./sound";

const ROLL_MS = 1000;
const PASS_MS = 1600;
const AUTO_MS = 750;

/**
 * Drives the pure engine with timers. Each timer belongs to exactly one state and is cancelled
 * as soon as the state changes or the game is paused, so nothing can fire into a later turn.
 */
export function useGame(start: PlayState, settings: Settings, paused: boolean) {
  const [ui, setUi] = useState<PlayState>(start);
  const [shake, setShake] = useState(false);
  const ref = useRef(ui);
  const step = STEP_MS[settings.speed];

  const apply = (fn: (s: PlayState) => PlayState) => {
    const next = fn(ref.current);
    if (next === ref.current) return false;
    ref.current = next;
    setUi(next);
    return true;
  };

  // Scheduled transitions, one per state.
  useEffect(() => {
    if (paused) return;
    let ms: number | null = null;
    let run: (() => void) | null = null;

    if (ui.phase === "rolling") {
      ms = ROLL_MS;
      run = () => {
        if (apply((s) => landRoll(s, throwShells()))) sfx.land();
      };
    } else if (ui.phase === "passing") {
      ms = PASS_MS;
      run = () => apply(passTurn);
    } else if (ui.phase === "move" && settings.autoMove) {
      const only = choices(ui);
      if (only.length === 1 && only[0]) {
        const from = only[0].from;
        ms = AUTO_MS;
        run = () => apply((s) => choosePawn(s, from));
      }
    } else if (ui.phase === "animating" && ui.anim) {
      const a = ui.anim;
      const done = a.shown >= a.path.length;
      ms = a.shown === 0 ? 40 : done ? 140 : step;
      run = () => {
        apply(advance);
        if (!done) sfx.step(a.shown);
      };
    }
    if (ms === null || !run) return;
    const id = setTimeout(run, ms);
    return () => clearTimeout(id);
  }, [ui, paused, settings.autoMove, step]);

  // Sound and shake for game events.
  const lastEvent = useRef(ui.event?.id ?? 0);
  useEffect(() => {
    const e = ui.event;
    if (!e || e.id === lastEvent.current) return undefined;
    lastEvent.current = e.id;
    if (e.kind === "capture") {
      sfx.capture();
      setShake(true);
      const id = setTimeout(() => setShake(false), 450);
      return () => clearTimeout(id);
    }
    if (e.kind === "finish") sfx.finish();
    if (e.kind === "out") sfx.out();
    if (e.kind === "win") sfx.win();
    if (e.kind === "nope") sfx.nope();
    return undefined;
  }, [ui.event]);

  const roll = () => {
    if (paused) return;
    if (apply(startRoll)) sfx.roll();
  };

  const choose = (from: number) => {
    if (paused) return;
    if (apply((s) => choosePawn(s, from)) && ref.current.phase === "animating") sfx.tap();
  };

  return { ui, shake, step, roll, choose };
}
