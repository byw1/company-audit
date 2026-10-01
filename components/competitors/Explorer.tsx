"use client";

import { ArrowDownUp, ChevronRight } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface MapPoint {
  id: string;
  name: string;
  now: { x: number; y: number };
  heading: { x: number; y: number };
  threat?: "high" | "medium" | "low";
  self?: boolean;
  /** Plain words: where it sits and where it's heading. */
  describe: string;
}

export interface Axes {
  x: { label: string; low: string; high: string };
  y: { label: string; low: string; high: string };
}

export interface CompetitorRow {
  id: string;
  name: string;
  kind: string;
  domain: string;
  tags: string[];
  threat: "high" | "medium" | "low";
  latest: string; // YYYY-MM[-DD]
  latestLabel: string;
  logo: ReactNode;
  threatNode: ReactNode;
  dossier: ReactNode;
}

const HoverCtx = createContext<{ hover: string | null; setHover: (id: string | null) => void }>({ hover: null, setHover: () => {} });

export function Explorer({ children }: { children: ReactNode }) {
  const [hover, setHover] = useState<string | null>(null);
  return <HoverCtx.Provider value={{ hover, setHover }}>{children}</HoverCtx.Provider>;
}

// ── Positioning map ────────────────────────────────────────────────────────

/**
 * Where each player sits now (dot) and where its own moves say it's heading
 * (arrow). The company is the accent; competitors are ink: emphasis, not a
 * rainbow. Identity is carried by the name and logo beside each dot, never by
 * colour.
 */
export function PositioningMap({ points, axes, compact = false }: { points: MapPoint[]; axes: Axes; compact?: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(960);
  const { hover, setHover } = useContext(HoverCtx);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(300, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const narrow = w < 560;
  const h = compact ? Math.round(Math.max(260, w * 0.58)) : Math.round(Math.max(340, Math.min(620, w * 0.6)));
  const pad = { l: narrow ? 26 : 40, r: narrow ? 10 : 18, t: 18, b: narrow ? 40 : 46 };
  const X = (v: number) => pad.l + (v / 100) * (w - pad.l - pad.r);
  const Y = (v: number) => pad.t + (1 - v / 100) * (h - pad.t - pad.b);
  const font = narrow ? 11 : 12.5;

  return (
    <div ref={wrap} className="relative w-full min-w-0">
      <svg viewBox={`0 0 ${w} ${h}`} className="block h-auto w-full" role="img" aria-label={`Positioning map: ${axes.x.label} across, ${axes.y.label} up.`}>
        <defs>
          {(["ink", "live"] as const).map((k) => (
            <marker key={k} id={`arrow-${k}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" style={{ fill: k === "live" ? "var(--live)" : "var(--ink-3)" }} />
            </marker>
          ))}
        </defs>

        {/* Quadrants and frame: hairlines, recessive. */}
        <rect x={pad.l} y={pad.t} width={w - pad.l - pad.r} height={h - pad.t - pad.b} rx={10} style={{ fill: "var(--surface)", stroke: "var(--line)" }} />
        <line x1={X(50)} x2={X(50)} y1={pad.t} y2={h - pad.b} style={{ stroke: "var(--line)" }} />
        <line x1={pad.l} x2={w - pad.r} y1={Y(50)} y2={Y(50)} style={{ stroke: "var(--line)" }} />

        {/* Axis words. */}
        <g style={{ fill: "var(--ink-3)", fontSize: 10.5, fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
          <text x={pad.l} y={h - pad.b + 18}>{axes.x.low.toUpperCase()}</text>
          <text x={w - pad.r} y={h - pad.b + 18} textAnchor="end">{axes.x.high.toUpperCase()}</text>
          <text x={X(50)} y={h - 8} textAnchor="middle" style={{ fill: "var(--ink-2)" }}>
            {axes.x.label.toUpperCase()} →
          </text>
          <text transform={`translate(${pad.l - 10} ${h - pad.b}) rotate(-90)`}>{axes.y.low.toUpperCase()}</text>
          {!narrow && (
            <text transform={`translate(${pad.l - 10} ${Y(50)}) rotate(-90)`} textAnchor="middle" style={{ fill: "var(--ink-2)" }}>
              {axes.y.label.toUpperCase()} →
            </text>
          )}
          <text transform={`translate(${pad.l - 10} ${pad.t}) rotate(-90)`} textAnchor="end">{axes.y.high.toUpperCase()}</text>
        </g>

        {/* Marks first, every label after, so no arrow is ever drawn across a name. */}
        {points.map((p) => {
          const x1 = X(p.now.x);
          const y1 = Y(p.now.y);
          const x2 = X(p.heading.x);
          const y2 = Y(p.heading.y);
          const moving = Math.hypot(x2 - x1, y2 - y1) > 8;
          const dim = hover !== null && hover !== p.id;
          const active = hover === p.id;
          return (
            <a
              key={p.id}
              href={p.self ? undefined : `#c-${p.id}`}
              aria-label={`${p.name}${p.self ? " (the company)" : ""}: ${p.describe}`}
              onMouseEnter={() => setHover(p.id)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(p.id)}
              onBlur={() => setHover(null)}
              style={{ opacity: dim ? 0.28 : 1, transition: "opacity 160ms" }}
              className="outline-none"
            >
              {moving && (
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  markerEnd={`url(#arrow-${p.self ? "live" : "ink"})`}
                  style={{ stroke: p.self ? "var(--live)" : "var(--ink-3)", strokeWidth: active ? 2.5 : 2, strokeLinecap: "round" }}
                />
              )}
              {/* A generous hit area: nobody should have to land on a dot. */}
              <circle cx={x1} cy={y1} r={16} fill="transparent" />
              <circle cx={x1} cy={y1} r={p.self ? 8 : 6} style={{ fill: p.self ? "var(--live)" : "var(--ink-2)", stroke: "var(--surface)", strokeWidth: 2 }} />
            </a>
          );
        })}
        <g aria-hidden style={{ pointerEvents: "none" }}>
          {points.map((p) => {
            const x1 = X(p.now.x);
            const y1 = Y(p.now.y);
            const x2 = X(p.heading.x);
            const y2 = Y(p.heading.y);
            const dim = hover !== null && hover !== p.id;
            const active = hover === p.id;
            const label = narrow ? p.name.split(" ")[0] : p.name;
            const place = placeLabel(p, points, { x1, y1, x2, y2, X, Y, w, h, pad, font, label });
            return (
              <text
                key={p.id}
                x={place.x}
                y={place.y}
                textAnchor={place.anchor}
                style={{
                  opacity: dim ? 0.28 : 1,
                  transition: "opacity 160ms",
                  fill: "var(--ink)",
                  fontSize: font,
                  fontWeight: p.self || active ? 600 : 500,
                  paintOrder: "stroke",
                  stroke: "var(--surface)",
                  strokeWidth: 4,
                  strokeLinejoin: "round",
                }}
              >
                {label}
              </text>
            );
          })}
        </g>
      </svg>
      {!compact && (
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px] text-ink-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-live" /> The company
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-ink-2" /> Competitor
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg width="22" height="8" aria-hidden>
              <line x1="1" y1="4" x2="17" y2="4" style={{ stroke: "var(--ink-3)", strokeWidth: 2 }} />
              <path d="M15,0 L21,4 L15,8 z" style={{ fill: "var(--ink-3)" }} />
            </svg>
            Direction of travel, from their last twelve months
          </span>
        </div>
      )}
    </div>
  );
}

type Place = { x: number; y: number; anchor: "start" | "middle" | "end" };

/**
 * Put a point's name where it collides least: away from its own arrow, inside
 * the frame, and clear of the other dots. Four candidates, scored.
 */
function placeLabel(
  p: MapPoint,
  all: MapPoint[],
  o: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    X: (v: number) => number;
    Y: (v: number) => number;
    w: number;
    h: number;
    pad: { l: number; r: number; t: number; b: number };
    font: number;
    label: string;
  },
): Place {
  const textW = o.label.length * o.font * 0.6;
  const len = Math.hypot(o.x2 - o.x1, o.y2 - o.y1) || 1;
  const dir = { x: (o.x2 - o.x1) / len, y: (o.y2 - o.y1) / len };
  const gap = 13;
  const candidates: (Place & { v: { x: number; y: number }; box: [number, number, number, number] })[] = [
    { x: o.x1 + gap, y: o.y1 + o.font * 0.35, anchor: "start", v: { x: 1, y: 0 }, box: [o.x1 + gap, o.y1 - o.font * 0.6, o.x1 + gap + textW, o.y1 + o.font * 0.5] },
    { x: o.x1 - gap, y: o.y1 + o.font * 0.35, anchor: "end", v: { x: -1, y: 0 }, box: [o.x1 - gap - textW, o.y1 - o.font * 0.6, o.x1 - gap, o.y1 + o.font * 0.5] },
    { x: o.x1, y: o.y1 + gap + o.font * 0.8, anchor: "middle", v: { x: 0, y: 1 }, box: [o.x1 - textW / 2, o.y1 + gap, o.x1 + textW / 2, o.y1 + gap + o.font] },
    { x: o.x1, y: o.y1 - gap - 2, anchor: "middle", v: { x: 0, y: -1 }, box: [o.x1 - textW / 2, o.y1 - gap - o.font, o.x1 + textW / 2, o.y1 - gap] },
  ];
  const others = all.filter((q) => q.id !== p.id).map((q) => ({ x: o.X(q.now.x), y: o.Y(q.now.y), hx: o.X(q.heading.x), hy: o.Y(q.heading.y) }));
  let best = candidates[0];
  let bestScore = Infinity;
  for (const c of candidates) {
    const [l, t, r, b] = c.box;
    let score = (c.v.x * dir.x + c.v.y * dir.y) * (len > 8 ? 3 : 0); // toward the arrow is bad
    if (l < o.pad.l + 2 || r > o.w - o.pad.r - 2 || t < o.pad.t + 2 || b > o.h - o.pad.b - 2) score += 6; // outside the frame
    const inside = (x: number, y: number) => x > l - 6 && x < r + 6 && y > t - 6 && y < b + 6;
    for (const q of others) {
      if (inside(q.x, q.y)) score += 4;
      for (let k = 1; k <= 8; k++) {
        if (inside(q.x + ((q.hx - q.x) * k) / 8, q.y + ((q.hy - q.y) * k) / 8)) {
          score += 2.5;
          break;
        }
      }
    }
    if (c.v.x === 1) score -= 0.2; // mild preference for reading order
    if (score < bestScore) {
      best = c;
      bestScore = score;
    }
  }
  return { x: best.x, y: best.y, anchor: best.anchor };
}

// ── Records table ──────────────────────────────────────────────────────────

const THREAT_RANK = { high: 0, medium: 1, low: 2 } as const;
type SortKey = "threat" | "name" | "latest";

/**
 * Every competitor as a row: sortable, tagged, expanding in place into its
 * dossier. Rows deep-link as /competitors#c-<id>.
 */
export function CompetitorTable({ rows }: { rows: CompetitorRow[] }) {
  const [sort, setSort] = useState<SortKey>("threat");
  const { hover, setHover } = useContext(HoverCtx);

  const sorted = useMemo(() => {
    const list = [...rows];
    if (sort === "name") return list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "latest") return list.sort((a, b) => b.latest.localeCompare(a.latest));
    return list.sort((a, b) => THREAT_RANK[a.threat] - THREAT_RANK[b.threat] || a.name.localeCompare(b.name));
  }, [rows, sort]);

  const Head = ({ k, children, className }: { k?: SortKey; children: ReactNode; className?: string }) =>
    k ? (
      <button
        type="button"
        onClick={() => setSort(k)}
        aria-pressed={sort === k}
        className={cn("u-label inline-flex items-center gap-1 text-left transition-colors hover:text-ink", sort === k && "text-ink", className)}
      >
        {children}
        <ArrowDownUp className={cn("size-3", sort === k ? "opacity-100" : "opacity-40")} aria-hidden />
      </button>
    ) : (
      <span className={cn("u-label", className)}>{children}</span>
    );

  const grid = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 md:grid-cols-[minmax(12rem,1.3fr)_minmax(0,1.2fr)_7rem_6.5rem_minmax(0,0.8fr)_1rem]";

  return (
    <div className="u-card overflow-hidden">
      <div className={cn(grid, "border-b border-line-soft bg-inset/60 px-4 py-2.5")}>
        <Head k="name">Company</Head>
        <Head className="hidden md:inline-flex">Tags</Head>
        <Head k="latest" className="hidden md:inline-flex">
          Latest move
        </Head>
        <Head k="threat">Threat</Head>
        <Head className="hidden md:inline-flex">Domain</Head>
        <span className="hidden md:block" />
      </div>
      <div className="u-rows">
        {sorted.map((r) => (
          <details
            key={r.id}
            id={`c-${r.id}`}
            className={cn("group scroll-mt-28 transition-colors", hover === r.id && "bg-hover")}
            onMouseEnter={() => setHover(r.id)}
            onMouseLeave={() => setHover(null)}
          >
            <summary className={cn(grid, "cursor-pointer list-none px-4 py-3 hover:bg-hover [&::-webkit-details-marker]:hidden")}>
              <span className="flex min-w-0 items-center gap-3">
                {r.logo}
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-medium text-ink">{r.name}</span>
                  <span className="block truncate text-[12px] text-ink-3">{r.kind}</span>
                </span>
              </span>
              <span className="hidden min-w-0 flex-wrap gap-1 md:flex">
                {r.tags.slice(0, 2).map((t) => (
                  <span key={t} className="rounded-md border border-line bg-inset px-1.5 py-[1px] text-[11.5px] text-ink-2">
                    {t}
                  </span>
                ))}
                {r.tags.length > 2 && <span className="rounded-md px-1 py-[1px] text-[11.5px] text-ink-3">+{r.tags.length - 2}</span>}
              </span>
              <span className="u-num hidden text-[12.5px] text-ink-2 md:block">{r.latestLabel}</span>
              <span>{r.threatNode}</span>
              <span className="hidden truncate font-mono text-[11.5px] text-ink-3 md:block">{r.domain}</span>
              <ChevronRight className="hidden size-4 text-ink-3 transition-transform group-open:rotate-90 md:block" aria-hidden />
            </summary>
            <div className="border-t border-line-soft bg-page/60 px-4 py-5 sm:px-6">{r.dossier}</div>
          </details>
        ))}
      </div>
    </div>
  );
}
