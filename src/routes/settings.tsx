import { useEffect, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PageShell } from "@/components/game/PageShell";
import { DEFAULT_SETTINGS, updateSettings, useSettings, type Speed } from "@/game/settings";
import { clearMatch, loadMatch } from "@/game/storage";
import { sfx } from "@/game/sound";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Chowka Bhara" },
      { name: "description", content: "Turn Chowka Bhara sound on or off, change the pawn speed and choose whether single moves play automatically." },
      { property: "og:title", content: "Settings — Chowka Bhara" },
      { property: "og:description", content: "Sound, speed and auto-move options for Chowka Bhara." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsScreen,
});

const SPEEDS: [Speed, string][] = [
  ["relaxed", "Relaxed"],
  ["normal", "Normal"],
  ["fast", "Fast"],
];

function Row({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <div className="font-bold">{title}</div>
        <div className="text-sm text-muted-foreground">{hint}</div>
      </div>
      {children}
    </div>
  );
}

function SettingsScreen() {
  const s = useSettings();
  const router = useRouter();
  const [hasSave, setHasSave] = useState(false);
  useEffect(() => setHasSave(loadMatch() !== null), []);
  const back = () => router.history.back();

  return (
    <PageShell title="Settings">
      <section className="paper-card divide-y-2 divide-border px-5 py-1">
        <Row title="Sound effects" hint="Shell throws, steps, captures and wins.">
          <Switch
            checked={s.sound}
            onCheckedChange={(v) => {
              updateSettings({ sound: v });
              if (v) sfx.finish();
            }}
            aria-label="Sound effects"
          />
        </Row>
        <Row title="Auto-move" hint="When only one pawn can move, move it for you.">
          <Switch checked={s.autoMove} onCheckedChange={(v) => updateSettings({ autoMove: v })} aria-label="Auto-move" />
        </Row>
        <div className="py-3">
          <div className="font-bold">Pawn speed</div>
          <div className="mb-2 text-sm text-muted-foreground">How fast pawns walk between squares.</div>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Pawn speed">
            {SPEEDS.map(([v, label]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={s.speed === v}
                onClick={() => updateSettings({ speed: v })}
                className={cn(
                  "rounded-xl border-2 border-board-line py-2 font-bold transition-all",
                  s.speed === v ? "bg-accent shadow-chunky-sm" : "bg-card opacity-75 hover:opacity-100",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="paper-card space-y-3 p-5">
        <div>
          <div className="font-bold">Saved game</div>
          <div className="text-sm text-muted-foreground">
            {hasSave ? "A game in progress is saved on this device." : "No saved game on this device."}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="paper"
            className="rounded-xl"
            disabled={!hasSave}
            onClick={() => {
              clearMatch();
              setHasSave(false);
            }}
          >
            <Trash2 /> Delete saved game
          </Button>
          <Button variant="paper" className="rounded-xl" onClick={() => updateSettings(DEFAULT_SETTINGS)}>
            Reset settings
          </Button>
        </div>
      </section>

      <Button variant="chunky" size="xl" className="w-full" onClick={back}>
        Done
      </Button>
    </PageShell>
  );
}
