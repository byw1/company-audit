import { audit } from "@/lib/content";
import type { Idea } from "@/lib/schema/public";

/** Ideas ranked: highest impact first, then least effort. The rank is the number on the matrix. */
export function rankedIdeas(): (Idea & { rank: number })[] {
  return [...audit.ideas.items]
    .sort((a, b) => b.impact - a.impact || a.effort - b.effort || a.title.localeCompare(b.title))
    .map((i, n) => ({ ...i, rank: n + 1 }));
}

const W = 420;
const H = 340;
const PAD = { l: 34, r: 12, t: 12, b: 34 };
const X = (effort: number) => PAD.l + ((effort - 0.5) / 5) * (W - PAD.l - PAD.r);
const Y = (impact: number) => PAD.t + (1 - (impact - 0.5) / 5) * (H - PAD.t - PAD.b);
const OFFSETS = [
  [-12, 0],
  [12, 0],
  [0, -20],
  [0, 20],
  [-24, 0],
  [24, 0],
];

/**
 * Impact against effort, both my estimates (labelled as such by the caller).
 * Quick wins sit top-left and are the only quadrant washed in the accent.
 * Every dot is a link to its idea, and the list beside it carries every value.
 */
export default function ImpactEffort({ compact = false }: { compact?: boolean }) {
  const ideas = rankedIdeas();
  const total = new Map<string, number>();
  for (const i of ideas) total.set(`${i.impact}-${i.effort}`, (total.get(`${i.impact}-${i.effort}`) ?? 0) + 1);
  const seen = new Map<string, number>();
  const placed = ideas.map((i) => {
    const key = `${i.impact}-${i.effort}`;
    const k = seen.get(key) ?? 0;
    seen.set(key, k + 1);
    // A lone idea sits on its point; ideas that share one fan out around it.
    const [dx, dy] = total.get(key) === 1 ? [0, 0] : OFFSETS[k % OFFSETS.length];
    return { ...i, cx: X(i.effort) + dx, cy: Y(i.impact) + dy };
  });
  const mid = { x: X(3), y: Y(3) };
  const quad = (label: string, x: number, y: number, anchor: "start" | "end") => (
    <text x={x} y={y} textAnchor={anchor} style={{ fill: "var(--ink-3)", fontSize: 10, fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
      {label.toUpperCase()}
    </text>
  );
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Impact against effort for each idea. The list beside the chart gives every value.">
      <rect x={PAD.l} y={PAD.t} width={mid.x - PAD.l} height={mid.y - PAD.t} rx={8} style={{ fill: "var(--live-tint)" }} />
      <rect x={PAD.l} y={PAD.t} width={W - PAD.l - PAD.r} height={H - PAD.t - PAD.b} rx={8} style={{ fill: "none", stroke: "var(--line)" }} />
      <line x1={mid.x} x2={mid.x} y1={PAD.t} y2={H - PAD.b} style={{ stroke: "var(--line)" }} />
      <line x1={PAD.l} x2={W - PAD.r} y1={mid.y} y2={mid.y} style={{ stroke: "var(--line)" }} />
      {!compact && (
        <>
          {quad("Quick wins", PAD.l + 8, PAD.t + 16, "start")}
          {quad("Big bets", W - PAD.r - 8, PAD.t + 16, "end")}
          {quad("Fill-ins", PAD.l + 8, H - PAD.b - 8, "start")}
          {quad("Not now", W - PAD.r - 8, H - PAD.b - 8, "end")}
        </>
      )}
      <g style={{ fill: "var(--ink-3)", fontSize: 10, fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
        <text x={PAD.l} y={H - 12}>LESS EFFORT</text>
        <text x={W - PAD.r} y={H - 12} textAnchor="end">
          MORE EFFORT →
        </text>
        <text transform={`translate(${PAD.l - 12} ${H - PAD.b}) rotate(-90)`}>LESS IMPACT</text>
        <text transform={`translate(${PAD.l - 12} ${PAD.t}) rotate(-90)`} textAnchor="end">
          MORE IMPACT →
        </text>
      </g>
      {placed.map((i) => {
        const quick = i.impact > 3 && i.effort < 3;
        return (
          <a key={i.id} href={`#idea-${i.id}`} aria-label={`${i.rank}. ${i.title}: impact ${i.impact} of 5, effort ${i.effort} of 5`}>
            <title>{`${i.rank}. ${i.title} (impact ${i.impact}/5, effort ${i.effort}/5)`}</title>
            <circle cx={i.cx} cy={i.cy} r={16} fill="transparent" />
            <circle cx={i.cx} cy={i.cy} r={10} style={{ fill: quick ? "var(--live)" : "var(--ink-2)", stroke: "var(--surface)", strokeWidth: 2 }} />
            <text x={i.cx} y={i.cy + 3.5} textAnchor="middle" style={{ fill: quick ? "var(--live-contrast)" : "var(--page)", fontSize: 10.5, fontWeight: 600, fontFamily: "var(--font-mono)" }}>
              {i.rank}
            </text>
          </a>
        );
      })}
    </svg>
  );
}
