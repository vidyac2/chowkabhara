import { useMemo } from "react";
import { BG } from "./player-styles";
import type { Color } from "@/game/logic";

const COLORS: Color[] = ["red", "blue", "green", "yellow"];

/** Falling paper confetti for the winner. Pure CSS, removed when unmounted. */
export function Confetti({ count = 70 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: (i * 37) % 100,
        delay: ((i * 53) % 100) / 40,
        dur: 2.6 + ((i * 17) % 10) / 6,
        drift: ((i * 29) % 120) - 60,
        spin: 360 + ((i * 47) % 540),
        w: 6 + (i % 4) * 2,
        color: COLORS[i % COLORS.length]!,
        round: i % 3 === 0,
      })),
    [count],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className={`absolute -top-4 block ${BG[p.color]} ${p.round ? "rounded-full" : "rounded-[2px]"}`}
          style={{
            left: `${p.left}%`,
            width: p.w,
            height: p.round ? p.w : p.w * 1.6,
            animation: `confetti-fall ${p.dur}s linear ${p.delay}s infinite`,
            ["--drift" as string]: `${p.drift}px`,
            ["--spin" as string]: `${p.spin}deg`,
          }}
        />
      ))}
    </div>
  );
}
