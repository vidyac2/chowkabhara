import { describe, expect, it } from "vitest";
import {
  advance,
  choices,
  choosePawn,
  landRoll,
  newPlay,
  passTurn,
  settle,
  startRoll,
  type PlayState,
} from "./engine";
import { FINISH, HOME, cellKey, cellOf, currentColor, isSafeCell, setPawn, throwShells } from "./logic";

// Shells for a given roll: n face up, none up = 8.
const shellsFor = (roll: number) => [0, 1, 2, 3].map((i) => (roll === 8 ? false : i < roll));

function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const runAnim = (s: PlayState) => {
  let cur = s;
  while (cur.phase === "animating") cur = advance(cur);
  return cur;
};

describe("a turn", () => {
  it("only lets the current player throw once until the turn is resolved", () => {
    const s = startRoll(newPlay(2));
    expect(s.phase).toBe("rolling");
    expect(startRoll(s)).toBe(s); // a second tap while rolling does nothing
  });

  it("brings a pawn out on a 4 and keeps the turn", () => {
    let s = landRoll(startRoll(newPlay(2)), shellsFor(4));
    expect(s.phase).toBe("move");
    s = runAnim(choosePawn(s, HOME));
    expect(s.game.pawns.red.filter((p) => p === 0)).toHaveLength(1);
    expect(currentColor(s.game)).toBe("red");
    expect(s.phase).toBe("roll");
  });

  it("passes to the next player when nothing can move", () => {
    let s = landRoll(startRoll(newPlay(2)), shellsFor(3));
    expect(s.phase).toBe("passing");
    s = passTurn(s);
    expect(currentColor(s.game)).toBe("blue");
  });

  it("moves the pawn one square per step along its own path", () => {
    let s = newPlay(2);
    s = { ...s, game: setPawn(s.game, "red", 0, 2) };
    s = landRoll(startRoll(s), shellsFor(3));
    s = choosePawn(s, 2);
    const seen: number[] = [];
    while (s.phase === "animating") {
      s = advance(s);
      seen.push(s.game.pawns.red[0]!);
    }
    expect(seen.slice(0, 3)).toEqual([3, 4, 5]);
    expect(s.game.pawns.red[0]).toBe(5);
    expect(currentColor(s.game)).toBe("blue"); // turn switches only after the move finished
  });

  it("ignores a second pawn tap while one is already moving", () => {
    let s = newPlay(2);
    s = { ...s, game: setPawn(setPawn(s.game, "red", 0, 2), "red", 1, 5) };
    s = choosePawn(landRoll(startRoll(s), shellsFor(2)), 2);
    expect(choosePawn(s, 5)).toBe(s);
  });

  it("explains an illegal pick without moving anything", () => {
    let s = newPlay(2);
    s = { ...s, game: setPawn(s.game, "red", 0, 3) };
    s = landRoll(startRoll(s), shellsFor(1));
    const after = choosePawn(s, HOME);
    expect(after.game).toEqual(s.game);
    expect(after.phase).toBe("move");
    expect(after.message).toContain("4 or an 8");
  });

  it("captures, sends the pawn home and grants another throw", () => {
    let s = newPlay(2);
    // Red index 10 and Blue index 2 are the same corner square.
    s = { ...s, game: setPawn(setPawn(s.game, "red", 0, 8), "blue", 0, 2) };
    s = runAnim(choosePawn(landRoll(startRoll(s), shellsFor(2)), 8));
    expect(s.game.pawns.blue[0]).toBe(HOME);
    expect(s.game.captures.red).toBe(1);
    expect(s.event?.kind).toBe("capture");
    expect(currentColor(s.game)).toBe("red");
  });

  it("settles a half-finished move so a saved game resumes cleanly", () => {
    let s = landRoll(startRoll(newPlay(3)), shellsFor(8));
    s = advance(choosePawn(s, HOME));
    const settled = settle(s);
    expect(settled.phase).toBe("roll");
    expect(settled.game.pawns.red).toContain(0);
  });
});

describe("full games", () => {
  for (const players of [2, 3, 4]) {
    it(`plays a ${players}-player game to a winner with every rule holding`, () => {
      const rnd = seeded(players * 101);
      let s = newPlay(players);
      let guard = 0;
      const finishedTurnOrder: string[] = [];
      while (s.phase !== "won" && guard++ < 50000) {
        const mover = currentColor(s.game);
        s = landRoll(startRoll(s), throwShells(rnd));
        const roll = s.roll!;
        if (s.phase === "passing") {
          s = passTurn(s);
        } else {
          const options = choices(s);
          const pick = options[Math.floor(rnd() * options.length)]!;
          s = choosePawn(s, pick.from);
          while (s.phase === "animating") {
            expect(currentColor(s.game)).toBe(mover);
            s = advance(s);
          }
        }
        // Pawns are never lost and stay on the board path.
        for (const c of s.game.players) {
          expect(s.game.pawns[c]).toHaveLength(4);
          for (const p of s.game.pawns[c]) expect(p >= HOME && p <= FINISH).toBe(true);
        }
        // Two colours never share a plain square after a move.
        const owner = new Map<string, string>();
        for (const c of s.game.players)
          for (const p of s.game.pawns[c]) {
            const cell = cellOf(c, p);
            if (!cell || isSafeCell(cell)) continue;
            const prev = owner.get(cellKey(cell));
            if (prev) expect(prev).toBe(c);
            owner.set(cellKey(cell), c);
          }
        // Turn order: same player again only after a 4, 8 or capture.
        if (s.phase !== "won") {
          const again = currentColor(s.game) === mover;
          const extra = roll === 4 || roll === 8 || s.message.includes("captured");
          expect(again).toBe(extra);
        }
        finishedTurnOrder.push(mover);
      }
      expect(s.phase).toBe("won");
      expect(s.game.pawns[s.winner!].every((p) => p === FINISH)).toBe(true);
      expect(new Set(finishedTurnOrder).size).toBe(players);
    });
  }
});
