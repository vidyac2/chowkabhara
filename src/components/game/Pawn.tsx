import { cn } from "@/lib/utils";
import type { Color } from "@/game/logic";
import { PAWN_CLASS } from "./player-styles";

interface PawnProps {
  color: Color;
  count?: number;
  className?: string;
}

/** The pawn artwork: a domed token with a shine and an optional stack count. */
export function Pawn({ color, count = 1, className }: PawnProps) {
  return (
    <span className={cn("pawn relative block aspect-square", PAWN_CLASS[color], className)} aria-hidden>
      <span className="absolute left-[20%] top-[14%] h-[24%] w-[30%] -rotate-[25deg] rounded-full bg-card opacity-60" />
      {count > 1 && (
        <span className="absolute -right-[22%] -top-[22%] flex aspect-square min-w-[55%] items-center justify-center rounded-full border-2 border-card bg-foreground px-0.5 text-[clamp(9px,1.6vw,13px)] font-bold leading-none text-background">
          {count}
        </span>
      )}
    </span>
  );
}
