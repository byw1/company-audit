import type { ReactNode } from "react";
import type { Stat } from "@/lib/claims";
import { audit, researchedLabel } from "@/lib/content";
import { cn } from "@/lib/utils";
import { ClaimChip } from "./Fact";

/**
 * Server-safe building blocks. Prep-only blocks are gated by the caller on the
 * server (see lib/view.ts), never hidden on the client.
 */

export function Container({ children, className, wide = false }: { children: ReactNode; className?: string; wide?: boolean }) {
  return <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", wide ? "max-w-[1320px]" : "max-w-[1180px]", className)}>{children}</div>;
}

/** "Researched September 2026", plus a fictional-example flag when the company isn't real. */
export function Stamp({ className, extra }: { className?: string; extra?: ReactNode }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1.5", className)}>
      <span className="u-label inline-flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-live" aria-hidden />
        {researchedLabel}
      </span>
      <span className="u-label hidden sm:inline">Outside-in, from public sources</span>
      {audit.config.company.fictional && (
        <span className="u-label rounded-[4px] border border-dashed border-ink-3/60 px-1.5 py-px text-ink-2">Fictional example</span>
      )}
      {extra}
    </div>
  );
}

/** Page opener: kicker, serif headline, standfirst, the research stamp. */
export function PageHead({
  kicker,
  title,
  sub,
  aside,
  className,
}: {
  kicker: string;
  title: ReactNode;
  sub?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("relative pt-10 pb-10 sm:pt-14 sm:pb-12", className)}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="max-w-[60rem] u-rise">
          <div className="u-label mb-4 text-live-ink">{kicker}</div>
          <h1 className="u-display text-[40px] text-ink sm:text-[54px] lg:text-[62px]">{title}</h1>
          {sub && <div className="u-prose mt-5 max-w-[68ch] text-[16px] sm:text-[17px]">{sub}</div>}
          <Stamp className="mt-6" />
        </div>
        {aside && <div className="u-rise lg:pb-1">{aside}</div>}
      </div>
    </header>
  );
}

export function SectionHead({
  id,
  title,
  sub,
  right,
  n,
  className,
}: {
  id?: string;
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
  n?: string;
  className?: string;
}) {
  return (
    <div id={id} className={cn("mb-6 flex scroll-mt-24 flex-wrap items-end justify-between gap-x-6 gap-y-3", className)}>
      <div className="min-w-0 max-w-[64rem]">
        {n && <div className="u-label mb-2">{n}</div>}
        <h2 className="u-display text-[28px] text-ink sm:text-[34px]">{title}</h2>
        {sub && <div className="u-prose mt-2 max-w-[70ch] text-[14.5px]">{sub}</div>}
      </div>
      {right}
    </div>
  );
}

export function Section({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn("scroll-mt-24 py-10 sm:py-14", className)}>
      {children}
    </section>
  );
}

/** A headline number with its label and its claim label. Proportional figures, in the sans. */
export function StatTile({ stat, className, size = "md" }: { stat: Stat; className?: string; size?: "md" | "lg" }) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className={cn("u-figure text-ink", size === "lg" ? "text-[40px] sm:text-[46px]" : "text-[32px] sm:text-[36px]")}>{stat.value}</div>
      <div className="mt-2.5 text-[13.5px] leading-snug text-ink-2">
        {stat.text}
        <ClaimChip fact={stat} />
      </div>
    </div>
  );
}

export function Tag({ children, className, tone = "plain" }: { children: ReactNode; className?: string; tone?: "plain" | "live" | "ghost" }) {
  const tones = {
    plain: "border-line bg-inset text-ink-2",
    live: "border-live-line bg-live-tint text-live-ink",
    ghost: "border-line text-ink-3",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-[2px] text-[11.5px] leading-[1.3] whitespace-nowrap", tones[tone], className)}>
      {children}
    </span>
  );
}

const LEVEL_WORD = { high: "High", medium: "Medium", low: "Low" } as const;
const LEVEL_BARS = { high: 3, medium: 2, low: 1 } as const;

/**
 * Severity or threat: three bars plus the word, so it never relies on colour.
 * Only "high" takes the accent: it's the thing that needs attention.
 */
export function LevelMeter({ level, label, className }: { level: "high" | "medium" | "low"; label?: string; className?: string }) {
  const n = LEVEL_BARS[level];
  return (
    <span className={cn("inline-flex items-center gap-2 whitespace-nowrap", className)} title={label ? `${label}: ${LEVEL_WORD[level]}` : LEVEL_WORD[level]}>
      <span className="inline-flex items-end gap-[2px]" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "w-[3px] rounded-[1px]",
              i === 1 ? "h-[6px]" : i === 2 ? "h-[9px]" : "h-[12px]",
              i <= n ? (level === "high" ? "bg-live" : "bg-ink-2") : "bg-line-strong",
            )}
          />
        ))}
      </span>
      <span className={cn("text-[12px]", level === "high" ? "font-medium text-ink" : "text-ink-2")}>{LEVEL_WORD[level]}</span>
    </span>
  );
}

/** A small card with a label row; the default surface for dense content. */
export function Panel({
  children,
  className,
  label,
  right,
  id,
}: {
  children: ReactNode;
  className?: string;
  label?: ReactNode;
  right?: ReactNode;
  id?: string;
}) {
  return (
    <div id={id} className={cn("u-card scroll-mt-24 overflow-hidden", className)}>
      {(label || right) && (
        <div className="flex items-center justify-between gap-3 border-b border-line-soft bg-inset/60 px-4 py-2.5">
          <div className="u-label">{label}</div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

/** "Go deeper" link styling for overview summaries. */
export const arrowLink =
  "group inline-flex items-center gap-1.5 text-[13px] font-medium text-ink transition-colors hover:text-live-ink";
