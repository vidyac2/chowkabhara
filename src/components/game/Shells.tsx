import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function Cowrie({ up }: { up: boolean }) {
  return (
    <svg viewBox="0 0 40 56" className="h-full w-full" aria-hidden>
      {up ? (
        <>
          <ellipse cx={20} cy={28} rx={17} ry={25} className="fill-shell stroke-board-line" strokeWidth={2.5} />
          <ellipse cx={13} cy={18} rx={4} ry={8} className="fill-card opacity-80" />
          <path d="M20 9 C 17.5 20, 17.5 36, 20 47 C 22.5 36, 22.5 20, 20 9 Z" className="fill-board-line" />
          <g className="stroke-board-line" strokeWidth={1.6} strokeLinecap="round">
            {[15, 20, 25, 30, 35, 40].map((y) => (
              <g key={y}>
                <line x1={14.5} y1={y} x2={18} y2={y} />
                <line x1={22} y1={y} x2={25.5} y2={y} />
              </g>
            ))}
          </g>
        </>
      ) : (
        <>
          <ellipse cx={20} cy={28} rx={17} ry={25} className="fill-shell-back stroke-board-line" strokeWidth={2.5} />
          <ellipse cx={15} cy={20} rx={6} ry={10} className="fill-shell opacity-70" />
          <g className="fill-shell-shade">
            <circle cx={25} cy={22} r={1.8} />
            <circle cx={27} cy={32} r={1.4} />
            <circle cx={21} cy={38} r={1.6} />
            <circle cx={14} cy={34} r={1.2} />
            <circle cx={24} cy={44} r={1.2} />
          </g>
        </>
      )}
    </svg>
  );
}

interface ShellsProps {
  shells: boolean[];
  rolling: boolean;
  /** Changes every throw so the shells settle at a fresh angle. */
  seed?: number;
  size?: "md" | "lg";
}

export function Shells({ shells, rolling, seed = 0, size = "md" }: ShellsProps) {
  const [shuffle, setShuffle] = useState(shells);

  useEffect(() => {
    if (!rolling) return;
    const id = setInterval(() => setShuffle(shells.map(() => Math.random() < 0.5)), 110);
    return () => clearInterval(id);
  }, [rolling, shells]);

  const faces = rolling ? shuffle : shells;
  const up = shells.filter(Boolean).length;
  return (
    <div
      className="flex items-end gap-1.5 [perspective:400px] sm:gap-2"
      role="img"
      aria-label={rolling ? "Shells in the air" : `${up} shells face up`}
    >
      {faces.map((isUp, i) => {
        const tilt = ((seed * 37 + i * 61) % 50) - 25;
        const lift = ((seed * 13 + i * 29) % 7) - 3;
        return (
          <div key={i} className={cn("relative", size === "lg" ? "h-16 w-11 sm:h-20 sm:w-14" : "h-12 w-9 sm:h-14 sm:w-10")}>
            <span className="absolute -bottom-1 left-1/2 h-2 w-[80%] -translate-x-1/2 rounded-full bg-board-line opacity-25 blur-[2px]" />
            <div
              key={`${rolling ? "r" : "s"}-${seed}`}
              className={cn("h-full w-full", rolling ? "animate-shell-tumble" : "animate-shell-land")}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div
                className="h-full w-full transition-transform duration-300"
                style={{ transform: rolling ? undefined : `translateY(${lift}px) rotate(${tilt}deg)` }}
              >
                <Cowrie up={isUp} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
