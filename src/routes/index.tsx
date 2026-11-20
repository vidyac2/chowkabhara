import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GameScreen } from "@/components/game/GameScreen";
import { SetupScreen } from "@/components/game/SetupScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chowka Bhara — Shell-throwing board game for 2–4 players" },
      {
        name: "description",
        content:
          "Play Chowka Bhara, the classic Ludo-style race game with cowrie shells. 2 to 4 players, pass and play on one device.",
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
  component: Index,
});

function Index() {
  const [match, setMatch] = useState<{ players: number; round: number } | null>(null);

  if (!match) return <SetupScreen onStart={(players) => setMatch({ players, round: 0 })} />;

  return (
    <GameScreen
      key={match.round}
      players={match.players}
      onPlayAgain={() => setMatch({ ...match, round: match.round + 1 })}
      onNewGame={() => setMatch(null)}
    />
  );
}
