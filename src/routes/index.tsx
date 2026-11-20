import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { BookOpen, Play, PlayCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Board } from "@/components/game/Board";
import { Pawn } from "@/components/game/Pawn";
import { Shells } from "@/components/game/Shells";
import { demoGame } from "@/components/game/demo";
import { SEAT_ORDER } from "@/game/logic";
import { formatTime, loadMatch, type Match } from "@/game/storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chowka Bhara — Shell-throwing board game for 2–4 players" },
      {
        name: "description",
        content:
          "Play Chowka Bhara, the classic Indian race game with cowrie shells. 2 to 4 players, pass and play on one phone, tablet or computer.",
      },
      { property: "og:title", content: "Chowka Bhara — Shell-throwing board game" },
      {
        property: "og:description",
        content: "Throw the cowries, capture your friends and race all four pawns to the centre.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomeScreen,
});

const DEMO = demoGame();

function HomeScreen() {
  const [saved, setSaved] = useState<Match | null>(null);
  useEffect(() => {
    const m = loadMatch();
    setSaved(m && m.play.phase !== "won" ? m : null);
  }, []);

  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-5xl items-center gap-6 px-5 py-8 md:grid-cols-[1.05fr_1fr] md:gap-10">
      <div className="order-2 flex flex-col items-center gap-6 text-center md:order-1 md:items-start md:text-left">
        <div className="animate-float" style={{ ["--tilt" as string]: "-4deg" }}>
          <Shells shells={[true, false, true, true]} rolling={false} seed={3} size="lg" />
        </div>
        <div className="space-y-3">
          <h1 className="font-display text-6xl font-bold leading-[0.9] sm:text-7xl">Chowka Bhara</h1>
          <p className="max-w-sm text-lg text-muted-foreground">
            The traditional cowrie-shell race game. Gather 2 to 4 players around one screen and race your pawns to the
            centre.
          </p>
          <div className="flex justify-center gap-1.5 md:justify-start">
            {SEAT_ORDER.map((c) => (
              <Pawn key={c} color={c} className="w-6" />
            ))}
          </div>
        </div>

        <div className="flex w-full max-w-sm flex-col gap-3">
          {saved && (
            <Button asChild variant="chunky" size="xl" className="h-auto w-full flex-col gap-0.5 py-3">
              <Link to="/play">
                <span className="flex items-center gap-2">
                  <PlayCircle /> Continue game
                </span>
                <span className="text-sm font-semibold opacity-85">
                  {saved.play.game.players.map((c) => saved.names[c]).join(" · ")} — {formatTime(saved.elapsedMs)}
                </span>
              </Link>
            </Button>
          )}
          <Button asChild variant={saved ? "paper" : "chunky"} size="xl" className="w-full">
            <Link to="/setup">
              <Play /> {saved ? "New game" : "Start game"}
            </Link>
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button asChild variant="paper" size="lg" className="rounded-xl">
              <Link to="/rules">
                <BookOpen /> Rules
              </Link>
            </Button>
            <Button asChild variant="paper" size="lg" className="rounded-xl">
              <Link to="/settings">
                <Settings /> Settings
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="order-1 mx-auto w-full max-w-[300px] md:order-2 md:max-w-[460px]" aria-hidden>
        <div style={{ transform: "perspective(1400px) rotateX(32deg) rotateZ(-10deg)" }}>
          <Board game={DEMO} />
        </div>
      </div>
    </main>
  );
}
