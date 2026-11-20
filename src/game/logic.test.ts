import { describe, expect, it } from "vitest";
import {
  FINISH,
  HOME,
  applyMove,
  createGame,
  grantsExtraTurn,
  legalMoves,
  nextTurn,
  rollValue,
  setPawn,
  startCell,
  type GameState,
} from "./logic";

const twoPlayer = (): GameState => createGame(2); // red (bottom) vs blue (top), red to move

describe("shell rolls", () => {
  it("counts face-up shells as the roll", () => {
    expect(rollValue(1)).toBe(1);
    expect(rollValue(3)).toBe(3);
    expect(rollValue(4)).toBe(4);
  });
  it("scores 8 when no shell lands face up", () => {
    expect(rollValue(0)).toBe(8);
  });
  it("gives an extra turn only on 4 or 8", () => {
    expect([1, 2, 3, 4, 8].filter(grantsExtraTurn)).toEqual([4, 8]);
  });
});

describe("leaving home", () => {
  it("needs a 4 or an 8", () => {
    const g = twoPlayer();
    expect(legalMoves(g, 3)).toHaveLength(0);
    expect(legalMoves(g, 4)[0]).toMatchObject({ from: HOME, to: 0 });
    expect(legalMoves(g, 8)[0]).toMatchObject({ from: HOME, to: 0 });
  });
  it("starts each player on the middle cell of their own side", () => {
    expect(startCell("red")).toEqual([4, 2]);
    expect(startCell("green")).toEqual([2, 4]);
    expect(startCell("blue")).toEqual([0, 2]);
    expect(startCell("white")).toEqual([2, 0]);
  });
});

describe("captures", () => {
  it("sends an opponent home when landing on a normal square", () => {
    // Red index 10 and Blue index 2 are both the top-left corner.
    let g = setPawn(twoPlayer(), "red", 0, 8);
    g = setPawn(g, "blue", 0, 2);
    const res = applyMove(g, { pawn: 0, from: 8, to: 10 });
    expect(res.captured).toEqual(["blue"]);
    expect(res.state.pawns.blue[0]).toBe(HOME);
    expect(res.state.hasCaptured.red).toBe(true);
  });
  it("never captures on a safe square", () => {
    // Red index 8 is Blue's start square (top middle).
    let g = setPawn(twoPlayer(), "red", 0, 6);
    g = setPawn(g, "blue", 0, 0);
    const res = applyMove(g, { pawn: 0, from: 6, to: 8 });
    expect(res.captured).toEqual([]);
    expect(res.state.pawns.blue[0]).toBe(0);
  });
});

describe("inner ring and centre", () => {
  it("blocks the inner ring until the player has captured", () => {
    const g = setPawn(twoPlayer(), "red", 0, 14);
    expect(legalMoves(g, 3)).toHaveLength(0);
    expect(legalMoves(g, 1)[0]).toMatchObject({ to: 15 });
    const unlocked = { ...g, hasCaptured: { ...g.hasCaptured, red: true } };
    expect(legalMoves(unlocked, 3)[0]).toMatchObject({ to: 17 });
  });
  it("needs an exact roll to reach the centre", () => {
    let g = setPawn(twoPlayer(), "red", 0, 22);
    g = { ...g, hasCaptured: { ...g.hasCaptured, red: true } };
    expect(legalMoves(g, 3)).toHaveLength(0);
    expect(legalMoves(g, 2)[0]).toMatchObject({ to: FINISH });
  });
  it("wins when all four pawns reach the centre", () => {
    let g = twoPlayer();
    g = { ...g, hasCaptured: { ...g.hasCaptured, red: true }, pawns: { ...g.pawns, red: [FINISH, FINISH, FINISH, 23] } };
    expect(applyMove(g, { pawn: 3, from: 23, to: FINISH }).won).toBe(true);
  });
});

describe("turns", () => {
  it("rotates through the players in order", () => {
    const g = createGame(3);
    expect(g.players).toEqual(["red", "green", "blue"]);
    expect(nextTurn(nextTurn(nextTurn(g))).turn).toBe(0);
  });
});
