import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const RULES: [string, string][] = [
  ["Throw the shells", "Four cowrie shells are thrown. Your roll is how many land mouth-up (1–4). None up scores 8."],
  ["Get out of home", "A 4 or an 8 brings a pawn out onto your start square. A 4 or 8 also gives you another throw."],
  ["Race around", "Pawns travel anticlockwise around the 16 outer squares, then through the 8 inner squares to the centre."],
  ["Capture", "Land on an opponent on a plain square to send them home — and throw again. Squares marked X are safe."],
  ["Unlock the inner ring", "You must capture at least once before any of your pawns can enter the inner ring."],
  ["Finish exactly", "You need the exact number to reach the centre. If you can't move, your turn passes."],
  ["Win", "The first player to bring all four pawns to the centre wins."],
];

export function HowToPlay({ trigger }: { trigger?: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="paper" size="icon-lg" aria-label="How to play">
            <HelpCircle />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="paper-card max-h-[88dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl">How to play</DialogTitle>
          <DialogDescription>Pass the device around — everyone plays on one screen.</DialogDescription>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
  );
}
