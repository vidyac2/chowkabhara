import { Link, createFileRoute } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Board } from "@/components/game/Board";
import { PageShell } from "@/components/game/PageShell";
import { demoGame } from "@/components/game/demo";
import { CONTROLS, RULES } from "@/game/rules-content";

export const Route = createFileRoute("/rules")({
  head: () => ({
    meta: [
      { title: "How to play Chowka Bhara — Rules" },
      { name: "description", content: "Chowka Bhara rules: cowrie shell rolls, bringing pawns out, captures, safe squares and the inner ring." },
      { property: "og:title", content: "How to play Chowka Bhara" },
      { property: "og:description", content: "Learn the rules of the traditional cowrie-shell race game in two minutes." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RulesScreen,
});

const DEMO = demoGame();

function RulesScreen() {
  return (
    <PageShell title="How to play">
      <div className="mx-auto w-full max-w-[280px]" aria-hidden>
        <Board game={DEMO} />
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Each player has a coloured home bay. Squares with an X are safe. The darker squares are the inner ring.
      </p>
      <section className="paper-card p-5">
        <h2 className="mb-3 font-display text-2xl font-bold">Rules</h2>
        <ol className="space-y-3">
          {RULES.map(([title, text], i) => (
            <li key={title} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-board-line bg-accent text-sm font-bold">
                {i + 1}
              </span>
              <p className="text-sm leading-snug">
                <span className="font-bold">{title}. </span>
                {text}
              </p>
            </li>
          ))}
        </ol>
      </section>
      <section className="paper-card p-5">
        <h2 className="mb-3 font-display text-2xl font-bold">Controls</h2>
        <ul className="space-y-2">
          {CONTROLS.map(([title, text]) => (
            <li key={title} className="text-sm leading-snug">
              <span className="font-bold">{title}: </span>
              {text}
            </li>
          ))}
        </ul>
      </section>
      <Button asChild variant="chunky" size="xl" className="w-full">
        <Link to="/setup">
          <Play /> Start game
        </Link>
      </Button>
    </PageShell>
  );
}
