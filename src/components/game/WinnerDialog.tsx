import { Home, RotateCcw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { FINISH, SEAT_ORDER, progress, type Color, type GameState } from "@/game/logic";
import { formatTime } from "@/game/storage";
import { cn } from "@/lib/utils";
import { Confetti } from "./Confetti";
import { Pawn } from "./Pawn";
import { INK_TEXT } from "./player-styles";

interface WinnerDialogProps {
  winner: Color | null;
  game: GameState;
  names: Record<Color, string>;
  wins: Record<Color, number>;
  elapsedMs: number;
  onPlayAgain: () => void;
  onNewGame: () => void;
  onHome: () => void;
}

export function WinnerDialog({ winner, game, names, wins, elapsedMs, onPlayAgain, onNewGame, onHome }: WinnerDialogProps) {
  const standings = SEAT_ORDER.filter((c) => game.players.includes(c)).sort(
    (a, b) => progress(game, b) - progress(game, a),
  );
  return (
    <>
      {winner && <Confetti />}
      <Dialog open={winner !== null}>
        <DialogContent
          className="paper-card max-h-[92dvh] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-2xl text-center [&>button:last-child]:hidden"
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          {winner && (
            <div className="flex flex-col items-center gap-3 py-1">
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className="animate-float" style={{ animationDelay: `${i * 150}ms` }}>
                    <Pawn color={winner} className="w-10" />
                  </span>
                ))}
              </div>
              <DialogTitle className={cn("animate-pop-in font-display text-5xl font-bold", INK_TEXT[winner])}>
                {names[winner]} wins!
              </DialogTitle>
              <DialogDescription className="text-base">
                All four pawns reached the centre in {formatTime(elapsedMs)}.
              </DialogDescription>
              <ol className="w-full space-y-1 text-left">
                {standings.map((c, i) => (
                  <li key={c} className="flex items-center gap-2 rounded-lg bg-muted px-2 py-1 text-sm font-semibold">
                    <span className="w-4 text-muted-foreground">{i + 1}</span>
                    <Pawn color={c} className="w-4" />
                    <span className={cn("flex-1 truncate", INK_TEXT[c])}>{names[c]}</span>
                    <span className="tabular-nums">{game.pawns[c].filter((p) => p === FINISH).length}/4 home</span>
                    <span className="w-14 text-right tabular-nums text-muted-foreground">{wins[c]} wins</span>
                  </li>
                ))}
              </ol>
              <div className="flex w-full flex-col gap-2.5 pt-1">
                <Button variant="chunky" size="xl" onClick={onPlayAgain}>
                  <RotateCcw /> Play again
                </Button>
                <div className="grid grid-cols-2 gap-2.5">
                  <Button variant="paper" size="lg" className="rounded-xl" onClick={onNewGame}>
                    <Users /> New players
                  </Button>
                  <Button variant="paper" size="lg" className="rounded-xl" onClick={onHome}>
                    <Home /> Home
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
