import type { ReactNode } from "react";
import { BASIS_HINT, BASIS_LABEL, type Basis, type Fact as FactT } from "@/lib/claims";
import { formatDate, hostOf, sourceById, sourceNumber } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * Every claim on the site renders through here, so every claim shows its
 * label: Sourced (with numbered links to the source), Outside-in read, or
 * Illustrative model. The label is shape-coded (solid, dashed, dotted) rather
 * than colour-coded, so it reads in print and for colour-blind readers.
 */

const LABEL_STYLE: Record<Basis, string> = {
  sourced: "border-solid border-line-strong text-ink-2",
  inferred: "border-dashed border-ink-3/60 text-ink-3",
  illustrative: "border-dotted border-ink-3/70 text-ink-3 [background:repeating-linear-gradient(135deg,transparent_0_3px,var(--line-soft)_3px_4px)]",
};

const SHORT: Record<Basis, string> = { sourced: "Sourced", inferred: "Read", illustrative: "Model" };

export function ClaimLabel({ basis, compact = false, className }: { basis: Basis; compact?: boolean; className?: string }) {
  return (
    <span
      title={`${BASIS_LABEL[basis]}: ${BASIS_HINT[basis]}`}
      className={cn(
        "inline-flex shrink-0 items-center rounded-[4px] border px-[5px] py-px font-mono text-[9px] leading-[1.35] font-medium tracking-[0.08em] whitespace-nowrap uppercase",
        LABEL_STYLE[basis],
        className,
      )}
    >
      {compact ? SHORT[basis] : BASIS_LABEL[basis]}
    </span>
  );
}

/** [3] links to a source, with a hover card naming it and when it was read. */
export function SourceRefs({ ids }: { ids: string[] }) {
  if (!ids.length) return null;
  return (
    <span className="group/src relative inline-flex items-baseline gap-0.5">
      {ids.map((id) => {
        const s = sourceById.get(id);
        const n = sourceNumber.get(id);
        if (!s) return null;
        return (
          <a
            key={id}
            href={s.url}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`Source ${n}: ${s.title}, ${s.publisher}, accessed ${formatDate(s.accessed)}`}
            className="u-num rounded-[3px] px-px text-[10.5px] text-ink-3 transition-colors hover:text-live-ink focus-visible:text-live-ink"
          >
            [{n}]
          </a>
        );
      })}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-40 hidden w-[min(19rem,80vw)] -translate-x-1/2 rounded-lg border border-line bg-surface p-2.5 text-left shadow-[var(--shadow-pop)] [@media(hover:hover)]:group-hover/src:block"
      >
        {ids.map((id) => {
          const s = sourceById.get(id);
          if (!s) return null;
          return (
            <span key={id} className="block py-1 not-first:mt-1 not-first:border-t not-first:border-line-soft">
              <span className="block text-[12px] leading-snug font-medium text-ink">{s.title}</span>
              <span className="mt-0.5 block font-mono text-[10px] tracking-[0.04em] text-ink-3">
                {s.publisher}
                {s.published ? ` · ${formatDate(s.published)}` : ""} · accessed {formatDate(s.accessed)} · {hostOf(s.url)}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}

/** The label and, for sourced claims, the source links. */
export function ClaimChip({ fact, compact = false, className }: { fact: FactT; compact?: boolean; className?: string }) {
  const ids = fact.basis === "illustrative" ? [] : (fact.sources ?? []);
  return (
    <span className={cn("ml-1.5 inline-flex translate-y-[-1px] items-center gap-1 align-middle whitespace-nowrap", className)}>
      <ClaimLabel basis={fact.basis} compact={compact} />
      <SourceRefs ids={ids} />
    </span>
  );
}

/**
 * A claim as text. `as="p"` for a paragraph; quotes render in quotation marks
 * with the speaker underneath.
 */
export function Fact({
  fact,
  as: Tag = "span",
  className,
  compact = false,
  chip = true,
}: {
  fact: FactT;
  as?: "span" | "p" | "div" | "li" | "blockquote";
  className?: string;
  compact?: boolean;
  /** Hide the chip only when the same claim's label is shown right beside it. */
  chip?: boolean;
}) {
  const isQuote = fact.basis === "sourced" && fact.quote;
  const speaker = fact.basis === "sourced" ? fact.speaker : undefined;
  return (
    <Tag className={className} data-basis={fact.basis}>
      {isQuote ? <>“{fact.text}”</> : fact.text}
      {chip && <ClaimChip fact={fact} compact={compact} />}
      {speaker && <span className="mt-1.5 block text-[12.5px] not-italic text-ink-3">— {speaker}</span>}
      {fact.note && <span className="mt-1 block text-[12px] text-ink-3">{fact.note}</span>}
    </Tag>
  );
}

/** The three labels, explained. Shown in the footer and on /sources. */
export function ClaimLegend({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-ink-3", className)}>
      {(["sourced", "inferred", "illustrative"] as const).map((b) => (
        <span key={b} className="inline-flex items-center gap-2">
          <ClaimLabel basis={b} />
          <span>{BASIS_HINT[b]}</span>
        </span>
      ))}
      {children}
    </div>
  );
}
