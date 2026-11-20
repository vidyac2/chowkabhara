import { Lock, LockOpen, Swords, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { FINISH, HOME, PAWNS_PER_PLAYER, SEAT_ORDER, progress, type Color, type GameState } from "@/game/logic";
import { Pawn } from "./Pawn";
import { BG, INK_TEXT, RING } from "./player-styles";

interface ScoreboardProps {
  game: GameState;
  names: Record<Color, string>;
  wins: Record<Color, number>;
  turn: Color;
}

export function Scoreboard({ game, names, wins, turn }: ScoreboardProps) {
  const seated = SEAT_ORDER.filter((c) => game.players.includes(c));
  return (
    <section className="paper-card p-2.5" aria-label="Scoreboard">
      <div className="mb-1.5 flex items-center justify-between px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        <span>Scoreboard</span>
        <span className="flex gap-3">
          <span title="Pawns at the centre">Home</span>
          <span title="Captures">
            <Swords className="inline h-3 w-3" />
          </span>
          <span title="Games won">
            <Trophy className="inline h-3 w-3" />
          </span>
        </span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {seated.map((color) => {
          const finished = game.pawns[color].filter((p) => p === FINISH).length;
          const waiting = game.pawns[color].filter((p) => p === HOME).length;
          const active = color === turn;
          const unlocked = game.hasCaptured[color];
          return (
            <li
              key={color}
              className={cn(
                "relative flex items-center gap-2 overflow-hidden rounded-xl border-2 px-2 py-1.5 transition-all",
                active ? cn("border-board-line bg-secondary ring-2 ring-offset-1 ring-offset-card", RING[color]) : "border-transparent bg-muted",
              )}
              aria-current={active ? "true" : undefined}
            >
              <span
                className={cn("absolute bottom-0 left-0 h-1 opacity-70 transition-all duration-500", BG[color])}
                style={{ width: `${progress(game, color)}%` }}
              />
              <Pawn color={color} className={cn("w-6 shrink-0", active && "animate-float")} />
              <div className="min-w-0 flex-1 leading-tight">
                <div className={cn("truncate font-display text-lg font-bold leading-none", INK_TEXT[color])}>
                  {names[color]}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                  {unlocked ? <LockOpen className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {unlocked ? "Inner ring open" : "Capture to unlock"} · {waiting} at home
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm font-extrabold tabular-nums">
                <span aria-label={`${finished} of ${PAWNS_PER_PLAYER} home`}>
                  {finished}/{PAWNS_PER_PLAYER}
                </span>
                <span className="w-3 text-center" aria-label={`${game.captures[color]} captures`}>
                  {game.captures[color]}
                </span>
                <span className="w-3 text-center" aria-label={`${wins[color]} wins`}>
                  {wins[color]}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
