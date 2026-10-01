import { Fact } from "@/components/audit/Fact";
import { audit, formatDate } from "@/lib/content";
import { cn } from "@/lib/utils";

/** The company's history, oldest first, with the most recent milestone marked. */
export default function Timeline() {
  const items = audit.company.timeline;
  return (
    <ol className="relative">
      {items.map((t, i) => {
        const last = i === items.length - 1;
        return (
          <li key={`${t.date}-${t.title}`} className="relative grid grid-cols-[5.5rem_1fr] gap-4 pb-6 last:pb-0 sm:grid-cols-[7rem_1fr]">
            <div className="u-num pt-0.5 text-right text-[12.5px] text-ink-3">{formatDate(t.date)}</div>
            <div className="relative border-l border-line pl-5">
              <span
                className={cn(
                  "absolute top-[7px] -left-[5px] size-[9px] rounded-full ring-[3px] ring-page",
                  last ? "bg-live" : "bg-line-strong",
                )}
                aria-hidden
              />
              <div className="text-[14.5px] font-medium text-ink">{t.title}</div>
              <Fact fact={t.fact} as="p" className="mt-1 text-[13.5px] leading-[1.55] text-ink-2" />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
