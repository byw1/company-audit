import { ClaimChip, Fact } from "@/components/audit/Fact";
import { audit } from "@/lib/content";

/**
 * Revenue lines as one series of horizontal bars: magnitude by length, the
 * value at the tip, the name and its label beside it. Lines without a public
 * share are listed, never estimated.
 */
export default function RevenueBars({ withDetail = true }: { withDetail?: boolean }) {
  const lines = audit.company.revenueLines;
  const max = Math.max(...lines.map((l) => l.share?.value ?? 0), 1);
  return (
    <figure>
      <ul className="space-y-4">
        {lines.map((l) => (
          <li key={l.name} className="min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[14px] font-medium text-ink">{l.name}</span>
              {l.share ? (
                <span className="flex items-baseline gap-1">
                  <span className="u-num text-[13px] text-ink">{l.share.value}%</span>
                  <ClaimChip fact={l.share.fact} compact className="ml-0.5" />
                </span>
              ) : (
                <span className="text-[12px] text-ink-3">Share not public</span>
              )}
            </div>
            {l.share && (
              <div className="mt-1.5 h-2.5 w-full" aria-hidden>
                <div className="h-full rounded-r-[4px] bg-live" style={{ width: `${(l.share.value / max) * 100}%` }} />
              </div>
            )}
            {withDetail && <Fact fact={l.what} as="p" className="mt-1.5 text-[13px] leading-[1.5] text-ink-3" />}
          </li>
        ))}
      </ul>
      <figcaption className="sr-only">
        Revenue by line:{" "}
        {lines.map((l) => `${l.name}${l.share ? ` ${l.share.value}%` : " (not public)"}`).join(", ")}.
      </figcaption>
    </figure>
  );
}
