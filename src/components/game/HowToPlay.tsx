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
import { RULES } from "@/game/rules-content";

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
