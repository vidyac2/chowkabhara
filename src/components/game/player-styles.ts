import type { Color } from "@/game/logic";

// Literal class names so Tailwind keeps them.
export const PAWN_CLASS: Record<Color, string> = {
  red: "pawn-red",
  blue: "pawn-blue",
  green: "pawn-green",
  white: "pawn-white",
};

export const INK_TEXT: Record<Color, string> = {
  red: "text-player-red-ink",
  blue: "text-player-blue-ink",
  green: "text-player-green-ink",
  white: "text-player-white-ink",
};

export const RING: Record<Color, string> = {
  red: "ring-player-red",
  blue: "ring-player-blue",
  green: "ring-player-green",
  white: "ring-player-white-ink",
};

export const CELL_TINT: Record<Color, string> = {
  red: "fill-player-red",
  blue: "fill-player-blue",
  green: "fill-player-green",
  white: "fill-player-white",
};

export const CELL_STROKE: Record<Color, string> = {
  red: "stroke-player-red",
  blue: "stroke-player-blue",
  green: "stroke-player-green",
  white: "stroke-player-white-ink",
};
