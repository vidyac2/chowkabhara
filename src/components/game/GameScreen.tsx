import { Plus, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { COLOR_NAMES, HOME, SEAT_ORDER, currentColor, grantsExtraTurn } from "@/game/logic";
import { useGame } from "@/game/useGame";
import { useMuted } from "@/game/useMuted";
import { Board } from "./Board";
import { HomeTray } from "./HomeTray";
import { HowToPlay } from "./HowToPlay";
import { Pawn } from "./Pawn";
import { INK_TEXT } from "./player-styles";
import { Shells } from "./Shells";
import { WinnerDialog } from "./WinnerDialog";

interface GameScreenProps {
  players: number;
  onPlayAgain: () => void;
  onNewGame: () => void;
}

export function GameScreen({ players, onPlayAgain, onNewGame }: GameScreenProps) {
  const { ui, roll, choose } = useGame(players);
  const [muted, toggleMuted] = useMuted();
  const { game } = ui;
  const turn = currentColor(game);
  const canBringOut = ui.phase === "move" && ui.legal.some((m) => m.from === HOME);
  const seated = SEAT_ORDER.filter((c) => game.players.includes(c));

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-3 px-3 pb-6 pt-3 sm:px-5">
      <header className="flex items-center justify-between gap-2">
        <h1 className="whitespace-nowrap font-display text-[1.7rem] font-bold leading-none sm:text-4xl">Chowka Bhara</h1>
        <div className="flex items-center gap-2">
          <HowToPlay />
          <Button
            variant="paper"
            size="icon-lg"
            onClick={toggleMuted}
            aria-label={muted ? "Turn sound on" : "Mute sound"}
            aria-pressed={muted}
          >
            {muted ? <VolumeX /> : <Volume2 />}
          </Button>
          <Button variant="paper" className="h-11 rounded-xl px-3" onClick={onNewGame} aria-label="New game">
            <Plus /> <span className="hidden sm:inline">New game</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <div className="mx-auto w-full max-w-[min(100%,560px)] lg:mx-0 lg:flex-1">
          <Board game={game} legal={ui.legal} shake={ui.shake} onChoose={choose} />
        </div>

        <aside className="flex w-full flex-col gap-3 lg:w-96 lg:shrink-0">
          <section className="paper-card flex flex-col gap-3 p-3" aria-live="polite">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Pawn color={turn} className="w-8" />
                <div className="leading-tight">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Turn</div>
                  <div className={cn("font-display text-2xl font-bold", INK_TEXT[turn])}>
                    {COLOR_NAMES[turn]}
                  </div>
                </div>
              </div>
              <div className="text-right leading-tight">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last roll</div>
                <div className="flex items-baseline justify-end gap-1.5">
                  {ui.roll !== null && grantsExtraTurn(ui.roll) && ui.phase !== "rolling" && (
                    <span className="rounded-full border-2 border-board-line bg-accent px-2 text-xs font-bold">
                      +1 throw
                    </span>
                  )}
                  <span className="text-3xl font-extrabold tabular-nums">
                    {ui.phase === "rolling" ? "…" : (ui.roll ?? "–")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Shells shells={ui.shells} rolling={ui.phase === "rolling"} />
              <Button
                variant="chunky"
                size="xl"
                className="flex-1 px-4"
                onClick={roll}
                disabled={ui.phase !== "roll"}
              >
                Roll shells
              </Button>
            </div>

            <p className="min-h-[2.75rem] rounded-xl bg-muted px-3 py-2 text-sm font-semibold leading-snug">
              {ui.message}
            </p>
          </section>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            {seated.map((color) => (
              <HomeTray
                key={color}
                color={color}
                pawns={game.pawns[color]}
                active={color === turn}
                canBringOut={color === turn && canBringOut}
                unlocked={game.hasCaptured[color]}
                onBringOut={() => choose(HOME)}
              />
            ))}
          </div>
        </aside>
      </div>

      <WinnerDialog winner={ui.winner} onPlayAgain={onPlayAgain} onNewGame={onNewGame} />
    </div>
  );
}
