import type { Color } from "@/game/logic";

// Literal class names so Tailwind keeps them.
export const PAWN_CLASS: Record<Color, string> = {
  red: "pawn-red",
  blue: "pawn-blue",
  green: "pawn-green",
  yellow: "pawn-yellow",
};

export const INK_TEXT: Record<Color, string> = {
  red: "text-player-red-ink",
  blue: "text-player-blue-ink",
  green: "text-player-green-ink",
  yellow: "text-player-yellow-ink",
};

export const RING: Record<Color, string> = {
  red: "ring-player-red",
  blue: "ring-player-blue",
  green: "ring-player-green",
  yellow: "ring-player-yellow",
};

export const BG: Record<Color, string> = {
  red: "bg-player-red",
  blue: "bg-player-blue",
  green: "bg-player-green",
  yellow: "bg-player-yellow",
};

export const CELL_TINT: Record<Color, string> = {
  red: "fill-player-red",
  blue: "fill-player-blue",
  green: "fill-player-green",
  yellow: "fill-player-yellow",
};

export const CELL_STROKE: Record<Color, string> = {
  red: "stroke-player-red",
  blue: "stroke-player-blue",
  green: "stroke-player-green",
  yellow: "stroke-player-yellow-ink",
};

export const BORDER: Record<Color, string> = {
  red: "border-player-red",
  blue: "border-player-blue",
  green: "border-player-green",
  yellow: "border-player-yellow-ink",
};
