import { RotateCcw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { COLOR_NAMES, type Color } from "@/game/logic";
import { cn } from "@/lib/utils";
import { Pawn } from "./Pawn";
import { INK_TEXT } from "./player-styles";

interface WinnerDialogProps {
  winner: Color | null;
  onPlayAgain: () => void;
  onNewGame: () => void;
}

export function WinnerDialog({ winner, onPlayAgain, onNewGame }: WinnerDialogProps) {
  return (
    <Dialog open={winner !== null}>
      <DialogContent
        className="paper-card w-[calc(100%-2rem)] max-w-sm rounded-2xl text-center [&>button:last-child]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {winner && (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="animate-float" style={{ animationDelay: `${i * 150}ms` }}>
                  <Pawn color={winner} className="w-10" />
                </span>
              ))}
            </div>
            <DialogTitle className={cn("font-display text-5xl font-bold", INK_TEXT[winner])}>
              {COLOR_NAMES[winner]} wins!
            </DialogTitle>
            <DialogDescription className="text-base">
              All four pawns made it home to the centre.
            </DialogDescription>
            <div className="flex w-full flex-col gap-3">
              <Button variant="chunky" size="xl" onClick={onPlayAgain}>
                <RotateCcw /> Play again
              </Button>
              <Button variant="paper" size="lg" className="rounded-xl" onClick={onNewGame}>
                <Users /> Change players
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
