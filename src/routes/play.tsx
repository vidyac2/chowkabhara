import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GameScreen } from "@/components/game/GameScreen";
import { loadMatch, rematch, saveMatch, type Match } from "@/game/storage";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Playing — Chowka Bhara" },
      { name: "description", content: "Your game of Chowka Bhara: throw the shells, move your pawns and capture your rivals." },
      { property: "og:title", content: "Playing Chowka Bhara" },
      { property: "og:description", content: "Pass-and-play Chowka Bhara for 2 to 4 players on one device." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlayRoute,
});

function PlayRoute() {
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);

  useEffect(() => {
    const m = loadMatch();
    if (!m) void navigate({ to: "/setup", replace: true });
    else setMatch(m);
  }, [navigate]);

  if (!match) {
    return <div className="flex min-h-dvh items-center justify-center font-display text-2xl">Setting up the board…</div>;
  }

  return (
    <GameScreen
      key={match.id}
      match={match}
      onRestart={(wins) => {
        const next = { ...rematch(match), wins };
        saveMatch(next);
        setMatch(next);
      }}
      onNewGame={() => void navigate({ to: "/setup" })}
      onHome={() => void navigate({ to: "/" })}
    />
  );
}
