import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function Cowrie({ up }: { up: boolean }) {
  return (
    <svg viewBox="0 0 40 56" className="h-12 w-9 sm:h-14 sm:w-10" aria-hidden>
      {up ? (
        <>
          <ellipse cx={20} cy={28} rx={17} ry={25} className="fill-shell stroke-board-line" strokeWidth={2.5} />
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

export function Shells({ shells, rolling }: { shells: boolean[]; rolling: boolean }) {
  const [shuffle, setShuffle] = useState(shells);

  useEffect(() => {
    if (!rolling) return;
    const id = setInterval(() => setShuffle(shells.map(() => Math.random() < 0.5)), 90);
    return () => clearInterval(id);
  }, [rolling, shells]);

  const faces = rolling ? shuffle : shells;
  return (
    <div className="flex items-end gap-1.5 sm:gap-2" aria-label={`${shells.filter(Boolean).length} shells face up`}>
      {faces.map((up, i) => (
        <div
          key={`${rolling ? "r" : "s"}-${i}`}
          className={cn(rolling ? "animate-shell-tumble" : "animate-shell-land")}
          style={{ animationDelay: `${i * 55}ms` }}
        >
          <Cowrie up={up} />
        </div>
      ))}
    </div>
  );
}
