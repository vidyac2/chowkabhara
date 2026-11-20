import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Clock, Home, Menu, Pause, Play, RotateCcw, Settings, Users, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { currentColor, grantsExtraTurn } from "@/game/logic";
import { useGame } from "@/game/useGame";
import { updateSettings, useSettings } from "@/game/settings";
import { formatTime, saveMatch, type Match } from "@/game/storage";
import { Board } from "./Board";
import { HowToPlay } from "./HowToPlay";
import { Pawn } from "./Pawn";
import { INK_TEXT } from "./player-styles";
import { Scoreboard } from "./Scoreboard";
import { Shells } from "./Shells";
import { WinnerDialog } from "./WinnerDialog";

interface GameScreenProps {
  match: Match;
  onRestart: (wins: Match["wins"]) => void;
  onNewGame: () => void;
  onHome: () => void;
}

type Confirm = "restart" | "new" | "home" | null;

export function GameScreen({ match, onRestart, onNewGame, onHome }: GameScreenProps) {
  const settings = useSettings();
  const [paused, setPaused] = useState(false);
  const { ui, shake, step, roll, choose } = useGame(match.play, settings, paused);
  const [wins, setWins] = useState(match.wins);
  const [elapsed, setElapsed] = useState(match.elapsedMs);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const { game } = ui;
  const turn = currentColor(game);
  const won = ui.phase === "won";

  // Game clock: runs while playing, stops when paused or finished.
  useEffect(() => {
    if (paused || won) return;
    const started = Date.now();
    const base = elapsed;
    const id = setInterval(() => setElapsed(base + Date.now() - started), 500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, won]);

  // Count the win once.
  const counted = useRef(won);
  useEffect(() => {
    if (!won || counted.current || !ui.winner) return;
    counted.current = true;
    const w = ui.winner;
    setWins((prev) => ({ ...prev, [w]: prev[w] + 1 }));
  }, [won, ui.winner]);

  // Save progress whenever the board settles, and when leaving the page.
  const latest = useRef({ ...match, play: ui, wins, elapsedMs: elapsed });
  latest.current = { ...match, play: ui, wins, elapsedMs: elapsed };
  useEffect(() => {
    if (ui.phase === "roll" || ui.phase === "move" || ui.phase === "won") saveMatch(latest.current);
  }, [ui, wins, match]);
  useEffect(() => {
    const id = setInterval(() => saveMatch(latest.current), 5000);
    const onHide = () => {
      saveMatch(latest.current);
      if (document.visibilityState === "hidden" && latest.current.play.phase !== "won") setPaused(true);
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
      saveMatch(latest.current);
    };
  }, []);

  // Space or Enter throws the shells.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== " " && e.key !== "Enter") return;
      const el = e.target as HTMLElement | null;
      if (el && (el.closest("button, input, [role=dialog], [role=menu]") || el.isContentEditable)) return;
      e.preventDefault();
      roll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const confirmText: Record<Exclude<Confirm, null>, [string, string, string]> = {
    restart: ["Restart this game?", "All pawns go back home and the clock resets. Win tallies are kept.", "Restart"],
    new: ["Start a new game?", "You'll choose players again. Starting a new game replaces this one.", "New game"],
    home: ["Leave to the home screen?", "Your game is saved. You can continue it from the home screen.", "Leave"],
  };
  const runConfirm = () => {
    saveMatch(latest.current);
    if (confirm === "restart") onRestart(wins);
    if (confirm === "new") onNewGame();
    if (confirm === "home") onHome();
    setConfirm(null);
  };

  const canPause = !won;
  const rollReady = ui.phase === "roll" && !paused;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-2 px-3 pb-5 pt-2.5 sm:px-5">
      <header className="flex items-center justify-between gap-2">
        <Link to="/" className="whitespace-nowrap font-display text-[1.6rem] font-bold leading-none sm:text-3xl">
          Chowka Bhara
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span
            className="hidden items-center gap-1 rounded-xl border-2 border-board-line bg-card px-2.5 py-1.5 text-sm font-bold tabular-nums min-[400px]:flex"
            aria-label={`Game time ${formatTime(elapsed)}`}
          >
            <Clock className="h-4 w-4" /> {formatTime(elapsed)}
          </span>
          <Button
            variant="paper"
            size="icon-lg"
            onClick={() => setPaused(true)}
            disabled={!canPause}
            aria-label="Pause game"
          >
            <Pause />
          </Button>
          <Button
            variant="paper"
            size="icon-lg"
            onClick={() => updateSettings({ sound: !settings.sound })}
            aria-label={settings.sound ? "Mute sound" : "Turn sound on"}
            aria-pressed={!settings.sound}
          >
            {settings.sound ? <Volume2 /> : <VolumeX />}
          </Button>
          <HowToPlay />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="paper" size="icon-lg" aria-label="Game menu">
                <Menu />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="paper-card w-48 rounded-xl">
              <DropdownMenuItem onSelect={() => setConfirm("restart")}>
                <RotateCcw /> Restart game
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setConfirm("new")}>
                <Users /> New game
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setConfirm("home")}>
                <Home /> Home screen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-col items-center gap-3 md:flex-row md:items-start md:justify-center md:gap-5">
        <div className="game-board-size shrink-0">
          <Board
            game={game}
            names={ui.names}
            legal={ui.legal}
            canChoose={ui.phase === "move" && !paused}
            shake={shake}
            event={ui.event}
            moving={ui.anim ? { color: ui.anim.color, pawn: ui.anim.pawn } : null}
            stepMs={step}
            onChoose={choose}
          />
        </div>

        <aside className="flex w-full max-w-[560px] flex-col gap-2.5 md:w-80 md:max-w-none lg:w-96">
          <section className="paper-card flex flex-col gap-2.5 p-3" aria-live="polite">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Pawn color={turn} className="w-9 shrink-0 animate-float" />
                <div className="min-w-0 leading-tight">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Now playing</div>
                  <div className={cn("truncate font-display text-2xl font-bold", INK_TEXT[turn])}>{ui.names[turn]}</div>
                </div>
              </div>
              <div className="shrink-0 text-right leading-tight">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Roll</div>
                <div className="flex items-baseline justify-end gap-1.5">
                  {ui.roll !== null && grantsExtraTurn(ui.roll) && ui.phase !== "rolling" && (
                    <span className="rounded-full border-2 border-board-line bg-accent px-2 text-xs font-bold">+1 throw</span>
                  )}
                  <span key={`${ui.throws}-${ui.phase === "rolling"}`} className="animate-pop-in text-4xl font-extrabold tabular-nums">
                    {ui.phase === "rolling" ? "…" : (ui.roll ?? "–")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Shells shells={ui.shells} rolling={ui.phase === "rolling"} seed={ui.throws} />
              <Button variant="chunky" size="xl" className="flex-1 px-4" onClick={roll} disabled={!rollReady}>
                {ui.phase === "rolling" ? "Throwing…" : "Roll shells"}
              </Button>
            </div>

            <p className="min-h-[2.75rem] rounded-xl bg-muted px-3 py-2 text-sm font-semibold leading-snug" data-testid="game-message">
              {ui.message}
            </p>
          </section>

          <Scoreboard game={game} names={ui.names} wins={wins} turn={turn} />
        </aside>
      </div>

      {paused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4 backdrop-blur-sm" role="dialog" aria-modal aria-label="Game paused">
          <div className="paper-card flex w-full max-w-xs animate-pop-in flex-col items-center gap-3 p-6 text-center">
            <Pause className="h-10 w-10" />
            <h2 className="font-display text-4xl font-bold">Paused</h2>
            <p className="text-sm text-muted-foreground">
              Clock stopped at {formatTime(elapsed)}. Your game is saved.
            </p>
            <Button variant="chunky" size="xl" className="w-full" onClick={() => setPaused(false)} autoFocus>
              <Play /> Resume
            </Button>
            <div className="grid w-full grid-cols-2 gap-2">
              <Button variant="paper" className="rounded-xl" onClick={() => setConfirm("restart")}>
                <RotateCcw /> Restart
              </Button>
              <Button variant="paper" className="rounded-xl" onClick={() => setConfirm("home")}>
                <Home /> Home
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent className="paper-card w-[calc(100%-2rem)] max-w-sm rounded-2xl">
          {confirm && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display text-2xl">{confirmText[confirm][0]}</AlertDialogTitle>
                <AlertDialogDescription>{confirmText[confirm][1]}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Keep playing</AlertDialogCancel>
                <AlertDialogAction className="rounded-xl" onClick={runConfirm}>
                  {confirmText[confirm][2]}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      <WinnerDialog
        winner={ui.winner}
        game={game}
        names={ui.names}
        wins={wins}
        elapsedMs={elapsed}
        onPlayAgain={() => onRestart(wins)}
        onNewGame={onNewGame}
        onHome={onHome}
      />
    </div>
  );
}
