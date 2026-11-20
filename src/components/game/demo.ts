import { createGame, setPawn, type GameState } from "@/game/logic";

/** A mid-game position used as decoration on the home and rules screens. */
export function demoGame(): GameState {
  let g = createGame(4);
  g = setPawn(g, "red", 0, 3);
  g = setPawn(g, "red", 1, 0);
  g = setPawn(g, "green", 0, 6);
  g = setPawn(g, "blue", 0, 12);
  g = setPawn(g, "blue", 1, 12);
  g = setPawn(g, "yellow", 0, 18);
  g = setPawn(g, "yellow", 1, 24);
  return { ...g, turn: 0 };
}
