import { cn } from "@/lib/utils";
import type { Color } from "@/game/logic";
import { PAWN_CLASS } from "./player-styles";

interface PawnProps {
  color: Color;
  count?: number;
  legal?: boolean;
  className?: string;
  onClick?: () => void;
  label?: string;
}

export function Pawn({ color, count = 1, legal = false, className, onClick, label }: PawnProps) {
  const body = (
    <>
      <span className="absolute left-[22%] top-[16%] h-[22%] w-[22%] rounded-full bg-card opacity-60" />
      {count > 1 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-card bg-foreground px-1 text-[11px] font-bold leading-none text-background">
          {count}
        </span>
      )}
    </>
  );
  const cls = cn("pawn relative block aspect-square", PAWN_CLASS[color], legal && "pawn-legal", className);

  if (legal && onClick) {
    return (
      <button
        type="button"
        aria-label={label ?? `Move ${color} pawn`}
        className={cn(cls, "touch-manipulation focus-visible:outline-none")}
        onClick={onClick}
      >
        {body}
      </button>
    );
  }
  return (
    <span className={cls} aria-hidden>
      {body}
    </span>
  );
}
