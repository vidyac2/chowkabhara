import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  FINISH,
  PATHS,
  cellKey,
  cellOf,
  currentColor,
  isSafeCell,
  startCell,
  type Color,
  type GameState,
  type Move,
} from "@/game/logic";
import { Pawn } from "./Pawn";
import { CELL_STROKE, CELL_TINT } from "./player-styles";

const CELL = 100;
const PAD = 14;
const VIEW = 5 * CELL + PAD * 2;

// Deterministic pseudo-random so the sketchy lines match between server and browser.
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function wobbly(x1: number, y1: number, x2: number, y2: number, rnd: () => number, amp = 2.4) {
  const segs = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) / 60));
  const pts = Array.from({ length: segs + 1 }, (_, i) => {
    const t = i / segs;
    const j = i === 0 || i === segs ? amp * 0.6 : amp;
    return [x1 + (x2 - x1) * t + (rnd() - 0.5) * j, y1 + (y2 - y1) * t + (rnd() - 0.5) * j] as const;
  });
  let d = `M ${pts[0]![0].toFixed(1)} ${pts[0]![1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i]!;
    const n = pts[i + 1]!;
    d += ` Q ${p[0].toFixed(1)} ${p[1].toFixed(1)} ${((p[0] + n[0]) / 2).toFixed(1)} ${((p[1] + n[1]) / 2).toFixed(1)}`;
  }
  const last = pts[pts.length - 1]!;
  return `${d} L ${last[0].toFixed(1)} ${last[1].toFixed(1)}`;
}

function useSketch() {
  return useMemo(() => {
    const rnd = seeded(7);
    const lines: string[] = [];
    for (let i = 0; i <= 5; i++) {
      const p = i * CELL;
      lines.push(wobbly(p, -3, p, 503, rnd));
      lines.push(wobbly(-3, p, 503, p, rnd));
    }
    const safe: [number, number][] = [[0, 2], [4, 2], [2, 0], [2, 4], [2, 2]];
    const crosses = safe.flatMap(([r, c]) => {
      const x = c * CELL;
      const y = r * CELL;
      return [
        wobbly(x + 20, y + 20, x + 80, y + 80, rnd, 3.5),
        wobbly(x + 80, y + 20, x + 20, y + 80, rnd, 3.5),
      ];
    });
    return { lines, crosses };
  }, []);
}

const INNER_RING = PATHS.red.slice(16, 24);

interface Group {
  color: Color;
  pos: number;
  count: number;
}

interface BoardProps {
  game: GameState;
  legal: Move[];
  shake: boolean;
  onChoose: (from: number) => void;
}

export function Board({ game, legal, shake, onChoose }: BoardProps) {
  const sketch = useSketch();
  const turnColor = currentColor(game);

  const groupsByCell = useMemo(() => {
    const map = new Map<string, Group[]>();
    for (const color of game.players) {
      const counts = new Map<number, number>();
      for (const pos of game.pawns[color]) if (pos >= 0) counts.set(pos, (counts.get(pos) ?? 0) + 1);
      for (const [pos, count] of counts) {
        const cell = cellOf(color, pos);
        if (!cell) continue;
        const key = cellKey(cell);
        map.set(key, [...(map.get(key) ?? []), { color, pos, count }]);
      }
    }
    return map;
  }, [game]);

  const legalFrom = new Set(legal.map((m) => m.from));
  const inset = `${(PAD / VIEW) * 100}%`;

  return (
    <div className={cn("board-surface relative aspect-square w-full select-none", shake && "animate-shake")}>
      <svg
        viewBox={`${-PAD} ${-PAD} ${VIEW} ${VIEW}`}
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        {INNER_RING.map(([r, c]) => (
          <rect key={`in-${r}-${c}`} x={c * CELL} y={r * CELL} width={CELL} height={CELL} className="fill-board-inner" />
        ))}
        {game.players.map((color) => {
          const [r, c] = startCell(color);
          return (
            <g key={`start-${color}`}>
              <rect x={c * CELL} y={r * CELL} width={CELL} height={CELL} className="fill-card opacity-60" />
              <rect
                x={c * CELL + 11}
                y={r * CELL + 11}
                width={CELL - 22}
                height={CELL - 22}
                rx={12}
                strokeWidth={6}
                strokeDasharray="10 7"
                className={cn(CELL_TINT[color], CELL_STROKE[color], "[fill-opacity:0.18]")}
              />
            </g>
          );
        })}
        <circle cx={250} cy={250} r={40} className="fill-accent opacity-80" />
        <g className="fill-none stroke-board-line" strokeLinecap="round" strokeLinejoin="round">
          {sketch.lines.map((d, i) => (
            <path key={`l-${i}`} d={d} strokeWidth={7} />
          ))}
          {sketch.crosses.map((d, i) => (
            <path key={`x-${i}`} d={d} strokeWidth={6} className="opacity-80" />
          ))}
        </g>
      </svg>

      <div className="absolute grid grid-cols-5 grid-rows-5" style={{ inset }}>
        {Array.from({ length: 25 }, (_, i) => {
          const r = Math.floor(i / 5);
          const c = i % 5;
          const groups = groupsByCell.get(`${r},${c}`) ?? [];
          const safe = isSafeCell([r, c]);
          return (
            <div
              key={i}
              className="relative flex items-center justify-center"
              aria-label={safe ? "Safe square" : undefined}
            >
              {groups.length === 1 && groups[0] && (
                <GroupPawn
                  group={groups[0]}
                  legal={groups[0].color === turnColor && legalFrom.has(groups[0].pos)}
                  onChoose={onChoose}
                  className="w-[58%]"
                />
              )}
              {groups.length > 1 && (
                <div className="grid h-[90%] w-[90%] grid-cols-2 place-items-center gap-[4%]">
                  {groups.map((g) => (
                    <GroupPawn
                      key={`${g.color}-${g.pos}`}
                      group={g}
                      legal={g.color === turnColor && legalFrom.has(g.pos)}
                      onChoose={onChoose}
                      className="w-[88%]"
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GroupPawn({
  group,
  legal,
  onChoose,
  className,
}: {
  group: Group;
  legal: boolean;
  onChoose: (from: number) => void;
  className?: string;
}) {
  return (
    <span className={cn("animate-hop block", className)}>
      <Pawn
        color={group.color}
        count={group.count}
        legal={legal && group.pos !== FINISH}
        onClick={() => onChoose(group.pos)}
        className="w-full"
      />
    </span>
  );
}
