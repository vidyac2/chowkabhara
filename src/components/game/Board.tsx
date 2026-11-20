import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  FINISH,
  HOME,
  PATHS,
  SEAT_ORDER,
  cellKey,
  cellOf,
  currentColor,
  startCell,
  type Color,
  type GameState,
  type Move,
} from "@/game/logic";
import type { GameEvent } from "@/game/engine";
import { Pawn } from "./Pawn";
import { BORDER, CELL_STROKE, CELL_TINT } from "./player-styles";

// Board geometry in SVG units. The 5x5 grid sits inside a wooden frame with a home bay on each side.
const CELL = 100;
const BAY = 80;
const OUTER = 5 * CELL + BAY * 2;
const MID = OUTER / 2;
const pct = (v: number) => `${(v / OUTER) * 100}%`;

/** Rotate a board point a quarter-turn anticlockwise around the centre, `times` times (matches the paths). */
function rotatePoint(x: number, y: number, times: number): [number, number] {
  let dx = x - MID;
  let dy = y - MID;
  for (let i = 0; i < times; i++) [dy, dx] = [-dx, dy];
  return [dx + MID, dy + MID];
}

const seatOf = (color: Color) => SEAT_ORDER.indexOf(color);

/** Centre of home-bay slot `i` (0–3) for a colour. Red's bay is below the bottom row. */
function homeSlot(color: Color, i: number): [number, number] {
  return rotatePoint(BAY + CELL + 37.5 + 75 * i, BAY + 5 * CELL + 40, seatOf(color));
}

const cellCentre = (r: number, c: number): [number, number] => [BAY + c * CELL + CELL / 2, BAY + r * CELL + CELL / 2];

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
      const p = BAY + i * CELL;
      lines.push(wobbly(p, BAY - 3, p, BAY + 503, rnd));
      lines.push(wobbly(BAY - 3, p, BAY + 503, p, rnd));
    }
    const safe: [number, number][] = [[0, 2], [4, 2], [2, 0], [2, 4], [2, 2]];
    const crosses = safe.flatMap(([r, c]) => {
      const x = BAY + c * CELL;
      const y = BAY + r * CELL;
      return [wobbly(x + 20, y + 20, x + 80, y + 80, rnd, 3.5), wobbly(x + 80, y + 20, x + 20, y + 80, rnd, 3.5)];
    });
    return { lines, crosses };
  }, []);
}

const INNER_RING = PATHS.red.slice(16, 24);

interface Token {
  color: Color;
  index: number;
  pos: number;
  x: number;
  y: number;
  size: number;
  z: number;
  /** Pawns stacked here when this is the top one, else 0. */
  badge: number;
}

const GROUP_OFFSETS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-23, 0], [23, 0]],
  3: [[-23, -23], [23, -23], [0, 23]],
  4: [[-23, -23], [23, -23], [-23, 23], [23, 23]],
};

/** Where every pawn sits: home pawns in their bay, board pawns grouped per square and stacked per colour. */
function layoutTokens(game: GameState, moving: { color: Color; pawn: number } | null): Token[] {
  const tokens: Token[] = [];
  const cells = new Map<string, { color: Color; pos: number; members: number[] }[]>();

  for (const color of game.players) {
    let homeRank = 0;
    game.pawns[color].forEach((pos, index) => {
      if (pos === HOME) {
        const [x, y] = homeSlot(color, homeRank++);
        tokens.push({ color, index, pos, x, y, size: 48, z: 5, badge: 0 });
        return;
      }
      const cell = cellOf(color, pos);
      if (!cell) return;
      const key = cellKey(cell);
      const groups = cells.get(key) ?? [];
      const g = groups.find((x) => x.color === color && x.pos === pos);
      if (g) g.members.push(index);
      else groups.push({ color, pos, members: [index] });
      cells.set(key, groups);
    });
  }

  for (const [key, groups] of cells) {
    const [r, c] = key.split(",").map(Number) as [number, number];
    const [cx, cy] = cellCentre(r, c);
    const offsets = GROUP_OFFSETS[Math.min(groups.length, 4)]!;
    const size = groups.length === 1 ? 60 : 42;
    groups.forEach((g, gi) => {
      const [ox, oy] = offsets[gi % offsets.length]!;
      g.members.forEach((index, k) => {
        const isMoving = moving?.color === g.color && moving.pawn === index;
        tokens.push({
          color: g.color,
          index,
          pos: g.pos,
          x: cx + ox,
          y: cy + oy - k * 5,
          size,
          z: isMoving ? 60 : 10 + Math.round((cy + oy) / 20) + k,
          badge: k === g.members.length - 1 ? g.members.length : 0,
        });
      });
    });
  }
  return tokens;
}

interface BoardProps {
  game: GameState;
  names?: Record<Color, string>;
  legal?: Move[];
  canChoose?: boolean;
  shake?: boolean;
  event?: GameEvent | null;
  moving?: { color: Color; pawn: number } | null;
  stepMs?: number;
  onChoose?: (from: number) => void;
  className?: string;
}

export function Board({
  game,
  names,
  legal = [],
  canChoose = false,
  shake = false,
  event = null,
  moving = null,
  stepMs = 210,
  onChoose,
  className,
}: BoardProps) {
  const sketch = useSketch();
  const turnColor = currentColor(game);
  const tokens = useMemo(() => layoutTokens(game, moving), [game, moving]);
  const legalFrom = new Set(legal.map((m) => m.from));
  const [wiggle, setWiggle] = useState<{ key: string; n: number } | null>(null);

  const burst =
    event?.kind === "capture" && event.cell
      ? (() => {
          const [r, c] = event.cell.split(",").map(Number) as [number, number];
          return { id: event.id, color: event.color, at: cellCentre(r, c) };
        })()
      : null;

  return (
    <div className={cn("relative aspect-square w-full select-none", shake && "animate-shake", className)}>
      <svg viewBox={`0 0 ${OUTER} ${OUTER}`} className="board-frame absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <radialGradient id="board-shine" cx="30%" cy="22%" r="85%">
            <stop offset="0%" style={{ stopColor: "var(--card)", stopOpacity: 0.55 }} />
            <stop offset="55%" style={{ stopColor: "var(--board)", stopOpacity: 0 }} />
            <stop offset="100%" style={{ stopColor: "var(--board-line)", stopOpacity: 0.18 }} />
          </radialGradient>
          <filter id="board-depth" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="0" dy="5" stdDeviation="5" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Home bays */}
        {game.players.map((color) => {
          const seat = seatOf(color);
          const active = color === turnColor;
          return (
            <g key={`bay-${color}`} transform={`rotate(${-90 * seat} ${MID} ${MID})`}>
              <rect
                x={BAY + CELL - 6}
                y={BAY + 5 * CELL + 10}
                width={3 * CELL + 12}
                height={BAY - 18}
                rx={26}
                strokeWidth={active ? 7 : 4}
                className={cn(CELL_TINT[color], CELL_STROKE[color], "[fill-opacity:0.32]")}
                style={active ? { animation: "turn-glow 1.4s ease-in-out infinite" } : undefined}
              />
              {[0, 1, 2, 3].map((i) => (
                <circle
                  key={i}
                  cx={BAY + CELL + 37.5 + 75 * i}
                  cy={BAY + 5 * CELL + 40}
                  r={22}
                  className="fill-wood-dark opacity-40"
                />
              ))}
            </g>
          );
        })}

        {/* Playing surface */}
        <rect x={BAY - 8} y={BAY - 8} width={516} height={516} rx={14} className="fill-board-line" filter="url(#board-depth)" />
        <rect x={BAY} y={BAY} width={500} height={500} className="fill-board" />
        {INNER_RING.map(([r, c]) => (
          <rect key={`in-${r}-${c}`} x={BAY + c * CELL} y={BAY + r * CELL} width={CELL} height={CELL} className="fill-board-inner" />
        ))}
        {game.players.map((color) => {
          const [r, c] = startCell(color);
          return (
            <g key={`start-${color}`}>
              <rect x={BAY + c * CELL} y={BAY + r * CELL} width={CELL} height={CELL} className="fill-card opacity-60" />
              <rect
                x={BAY + c * CELL + 11}
                y={BAY + r * CELL + 11}
                width={CELL - 22}
                height={CELL - 22}
                rx={12}
                strokeWidth={6}
                strokeDasharray="10 7"
                className={cn(CELL_TINT[color], CELL_STROKE[color], "[fill-opacity:0.22]")}
              />
            </g>
          );
        })}
        <circle cx={MID} cy={MID} r={40} className="fill-accent opacity-90" />
        <rect x={BAY} y={BAY} width={500} height={500} fill="url(#board-shine)" />
        <g className="fill-none stroke-board-line" strokeLinecap="round" strokeLinejoin="round">
          {sketch.lines.map((d, i) => (
            <path key={`l-${i}`} d={d} strokeWidth={7} />
          ))}
          {sketch.crosses.map((d, i) => (
            <path key={`x-${i}`} d={d} strokeWidth={6} className="opacity-75" />
          ))}
        </g>
      </svg>

      {/* Capture burst */}
      {burst && (
        <span
          key={burst.id}
          className={cn("pointer-events-none absolute z-[70] aspect-square rounded-full border-[6px] animate-burst", BORDER[burst.color])}
          style={{ left: pct(burst.at[0]), top: pct(burst.at[1]), width: pct(90) }}
        />
      )}

      {/* Pawns */}
      <div className="absolute inset-0">
        {tokens.map((t) => {
          const mine = canChoose && t.color === turnColor && t.pos !== FINISH;
          const legalHere = mine && legalFrom.has(t.pos);
          const key = `${t.color}-${t.index}`;
          const dur = t.pos === HOME ? 560 : Math.round(stepMs * 0.85);
          const who = names?.[t.color] ?? t.color;
          const style = {
            left: pct(t.x),
            top: pct(t.y),
            width: pct(t.size),
            zIndex: legalHere ? t.z + 30 : t.z,
            transition: `left ${dur}ms cubic-bezier(.4,.1,.3,1), top ${dur}ms cubic-bezier(.4,.1,.3,1), width 200ms ease`,
          };
          const art = (
            <span
              key={`${t.pos}-${wiggle?.key === key ? wiggle.n : 0}`}
              className={cn("block", wiggle?.key === key ? "animate-nope" : "animate-hop")}
            >
              <Pawn color={t.color} count={t.badge} className="w-full" />
            </span>
          );
          if (!mine) {
            return (
              <span key={key} className="absolute -translate-x-1/2 -translate-y-1/2" style={style}>
                {art}
              </span>
            );
          }
          return (
            <button
              key={key}
              type="button"
              data-pawn={key}
              data-legal={legalHere ? "true" : "false"}
              aria-label={
                t.pos === HOME ? `Bring ${who}'s pawn out` : `Move ${who}'s pawn${legalHere ? "" : " (can't move)"}`
              }
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 touch-manipulation rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring",
                "after:absolute after:-inset-[35%] after:rounded-full",
                legalHere ? "pawn-legal" : "cursor-pointer",
              )}
              style={style}
              onClick={() => {
                if (!legalHere) setWiggle({ key, n: (wiggle?.n ?? 0) + 1 });
                onChoose?.(t.pos);
              }}
            >
              {art}
            </button>
          );
        })}
      </div>
    </div>
  );
}
