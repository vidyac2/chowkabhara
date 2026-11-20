import { useState } from "react";
import { BookOpen, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { COLOR_NAMES, playersFor } from "@/game/logic";
import { HowToPlay } from "./HowToPlay";
import { Pawn } from "./Pawn";
import { Shells } from "./Shells";

export function SetupScreen({ onStart }: { onStart: (players: number) => void }) {
  const [count, setCount] = useState(2);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-8 px-5 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="animate-float" style={{ ["--tilt" as string]: "-4deg" }}>
          <Shells shells={[true, false, true, true]} rolling={false} />
        </div>
        <h1 className="font-display text-6xl font-bold leading-none text-foreground sm:text-7xl">
          Chowka Bhara
        </h1>
        <p className="max-w-xs text-base text-muted-foreground">
          The shell-throwing race game. Pass the phone, throw the cowries, race your pawns to the centre.
        </p>
      </div>

      <section className="paper-card w-full space-y-4 p-5">
        <h2 className="font-display text-2xl font-bold">How many players?</h2>
        <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Number of players">
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={count === n}
              onClick={() => setCount(n)}
              className={cn(
                "flex touch-manipulation flex-col items-center gap-2 rounded-xl border-2 border-board-line px-2 py-3 transition-all",
                count === n ? "bg-accent shadow-chunky-sm" : "bg-card opacity-75 hover:opacity-100",
              )}
            >
              <span className="text-3xl font-extrabold leading-none">{n}</span>
              <span className="flex flex-wrap justify-center gap-0.5">
                {playersFor(n).map((c) => (
                  <Pawn key={c} color={c} className="w-4" />
                ))}
              </span>
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Playing: {playersFor(count).map((c) => COLOR_NAMES[c]).join(", ")}
        </p>
        <Button variant="chunky" size="xl" className="w-full" onClick={() => onStart(count)}>
          <Play /> Start game
        </Button>
      </section>

      <HowToPlay
        trigger={
          <Button variant="paper" size="lg" className="rounded-xl">
            <BookOpen /> How to play
          </Button>
        }
      />
    </main>
  );
}
