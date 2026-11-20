import { Flag, Lock, LockOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLOR_NAMES, FINISH, HOME, PAWNS_PER_PLAYER, type Color } from "@/game/logic";
import { Pawn } from "./Pawn";
import { INK_TEXT, RING } from "./player-styles";

interface HomeTrayProps {
  color: Color;
  pawns: number[];
  active: boolean;
  canBringOut: boolean;
  unlocked: boolean;
  onBringOut: () => void;
}

export function HomeTray({ color, pawns, active, canBringOut, unlocked, onBringOut }: HomeTrayProps) {
  const waiting = pawns.filter((p) => p === HOME).length;
  const finished = pawns.filter((p) => p === FINISH).length;

  return (
    <div
      className={cn(
        "paper-card flex flex-col gap-1.5 px-3 py-2 transition-all",
        active ? cn("ring-4 ring-offset-2 ring-offset-background", RING[color]) : "opacity-85",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn("font-display text-lg font-bold leading-none", INK_TEXT[color])}>
          {COLOR_NAMES[color]}
        </span>
        <span
          className="flex items-center gap-1 text-xs font-semibold text-muted-foreground"
          title={unlocked ? "Inner ring unlocked" : "Capture a pawn to unlock the inner ring"}
        >
          {unlocked ? <LockOpen className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
          <span className="hidden min-[380px]:inline">{unlocked ? "Inner" : "Locked"}</span>
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1" aria-label={`${waiting} waiting at home`}>
          {Array.from({ length: PAWNS_PER_PLAYER }, (_, i) =>
            i < waiting ? (
              <Pawn
                key={i}
                color={color}
                legal={canBringOut && i === 0}
                onClick={onBringOut}
                label={`Bring a ${COLOR_NAMES[color]} pawn out`}
                className="w-5 min-[380px]:w-6 sm:w-7"
              />
            ) : (
              <span key={i} className="block aspect-square w-5 rounded-full border-2 border-dashed border-border min-[380px]:w-6 sm:w-7" />
            ),
          )}
        </div>
        <span
          className="flex shrink-0 items-center gap-1 text-sm font-bold tabular-nums"
          aria-label={`${finished} of ${PAWNS_PER_PLAYER} finished`}
        >
          <Flag className="h-3.5 w-3.5 text-muted-foreground" />
          {finished}/{PAWNS_PER_PLAYER}
        </span>
      </div>
    </div>
  );
}
