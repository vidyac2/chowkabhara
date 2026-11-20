import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/game/PageShell";
import { Pawn } from "@/components/game/Pawn";
import { INK_TEXT } from "@/components/game/player-styles";
import { COLOR_NAMES, SEAT_ORDER, playersFor, type Color } from "@/game/logic";
import { createMatch, lastNames, saveMatch } from "@/game/storage";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Choose players — Chowka Bhara" },
      { name: "description", content: "Pick 2, 3 or 4 players and name them before starting a game of Chowka Bhara." },
      { property: "og:title", content: "Choose players — Chowka Bhara" },
      { property: "og:description", content: "Pick 2, 3 or 4 players and start racing to the centre." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SetupScreen,
});

const SEAT_LABEL: Record<Color, string> = { red: "bottom", green: "right", blue: "top", yellow: "left" };

function SetupScreen() {
  const navigate = useNavigate();
  const [count, setCount] = useState(2);
  const [names, setNames] = useState<Record<Color, string>>({ ...COLOR_NAMES });

  useEffect(() => {
    const prev = lastNames();
    setNames((n) => ({ ...n, ...prev }));
  }, []);

  const start = () => {
    const match = createMatch(count, names);
    saveMatch(match);
    void navigate({ to: "/play" });
  };

  return (
    <PageShell title="New game">
      <section className="paper-card space-y-4 p-5">
        <h2 className="font-display text-2xl font-bold">How many players?</h2>
        <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Number of players">
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={count === n}
              aria-label={`${n} players`}
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
      </section>

      <section className="paper-card space-y-3 p-5">
        <h2 className="font-display text-2xl font-bold">Player names</h2>
        {SEAT_ORDER.filter((c) => playersFor(count).includes(c)).map((c) => (
          <label key={c} className="flex items-center gap-3">
            <Pawn color={c} className="w-8 shrink-0" />
            <span className="flex-1">
              <span className={cn("block text-xs font-bold uppercase tracking-wider", INK_TEXT[c])}>
                {COLOR_NAMES[c]} · sits {SEAT_LABEL[c]}
              </span>
              <Input
                value={names[c]}
                maxLength={14}
                onChange={(e) => setNames((n) => ({ ...n, [c]: e.target.value }))}
                onBlur={(e) => !e.target.value.trim() && setNames((n) => ({ ...n, [c]: COLOR_NAMES[c] }))}
                aria-label={`${COLOR_NAMES[c]} player name`}
                className="h-11 rounded-xl border-2 border-board-line bg-card text-base font-semibold"
              />
            </span>
          </label>
        ))}
      </section>

      <Button variant="chunky" size="xl" className="w-full" onClick={start}>
        <Play /> Start game
      </Button>
    </PageShell>
  );
}
