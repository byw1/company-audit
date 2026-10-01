import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { ClaimChip, Fact } from "@/components/audit/Fact";
import { Container, PageHead, Section, SectionHead, Tag } from "@/components/audit/ui";
import Ledger, { type LedgerRow } from "@/components/record/Ledger";
import { audit, formatDate, requireModule, sourceById } from "@/lib/content";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Public record" };

const KIND_LABEL: Record<string, string> = {
  filing: "Filing",
  letter: "Shareholder letter",
  "earnings-call": "Earnings call",
  interview: "Interview",
  podcast: "Podcast",
  press: "Press",
  post: "Post",
  talk: "Talk",
  "job-posting": "Job posting",
};

export default function RecordPage() {
  requireModule("record");
  const company = audit.config.company.name;
  const items = [...audit.record.items].sort((a, b) => b.date.localeCompare(a.date));

  const rows: LedgerRow[] = items.map((r) => ({
    id: r.id,
    theme: r.theme,
    node: (
      <article id={`rec-${r.id}`} className="grid scroll-mt-28 gap-4 px-5 py-5 lg:grid-cols-[9rem_minmax(0,1.25fr)_1.5rem_minmax(0,1fr)] lg:gap-6">
        <div className="flex flex-row items-center gap-2 lg:flex-col lg:items-start lg:gap-1.5">
          <span className="u-num text-[12.5px] text-ink">{formatDate(r.date)}</span>
          <Tag tone="ghost">{KIND_LABEL[r.kind] ?? r.kind}</Tag>
          {r.theme && <span className="u-label hidden lg:block">{r.theme}</span>}
        </div>
        <div>
          <div className="u-label mb-2">What they said</div>
          <h3 className="mb-2 text-[15px] font-semibold text-ink">{r.title}</h3>
          <blockquote className={cn("border-l-2 pl-4", r.said.quote ? "border-ink" : "border-line-strong")}>
            <Fact fact={r.said} as="p" className={cn("text-ink", r.said.quote ? "u-display text-[20px] leading-snug" : "text-[14.5px] leading-[1.6]")} />
          </blockquote>
        </div>
        <ArrowRight className="hidden size-4 self-center text-live-ink lg:block" aria-hidden />
        <div>
          <div className="u-label mb-2 text-live-ink">What it implies for the role</div>
          <Fact fact={r.implies} as="p" className="text-[14.5px] leading-[1.6] text-ink-2" />
        </div>
      </article>
    ),
  }));

  return (
    <Container wide>
      <PageHead
        kicker="Public record"
        title={
          <>
            What {company} has said about where it’s going, <em className="text-live-ink italic">and what it means for this role.</em>
          </>
        }
        sub="Filings, letters, calls, interviews and press, read as a ledger. Quotes are verbatim and checked against the source; the implications are my read."
      />

      <Section className="pt-0">
        <h2 className="sr-only">What they said, and what it implies for the role</h2>
        <Ledger rows={rows} />
      </Section>

      {audit.record.hiring.length > 0 && (
        <Section>
          <SectionHead n="Signals from their hiring" title="Where they’re investing, read from open roles" sub="Job postings are the most current public statement of priorities. Each one is dated and linked." />
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-4">
            {audit.record.hiring.map((h) => {
              const s = sourceById.get(h.source);
              return (
                <article key={h.id} id={`hire-${h.id}`} className="u-card w-[78vw] max-w-[22rem] shrink-0 snap-start scroll-mt-28 p-5 md:w-auto md:max-w-none">
                  <div className="flex items-center justify-between gap-2">
                    <span className="u-label">{h.team}</span>
                    {h.posted && <span className="u-num text-[11.5px] text-ink-3">{formatDate(h.posted)}</span>}
                  </div>
                  <h3 className="mt-2 text-[15px] leading-snug font-semibold text-ink">
                    {h.title}
                    {s && <ClaimChip fact={{ basis: "sourced", text: h.title, sources: [h.source] }} compact />}
                  </h3>
                  {h.location && <div className="mt-0.5 text-[12px] text-ink-3">{h.location}</div>}
                  <Fact fact={h.signal} as="p" className="mt-3 text-[13.5px] leading-[1.55] text-ink-2" />
                </article>
              );
            })}
          </div>
        </Section>
      )}
    </Container>
  );
}
