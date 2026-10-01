import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { ClaimLegend, Fact } from "@/components/audit/Fact";
import { CompanyLogo } from "@/components/audit/CompanyLogo";
import { Container, PageHead, Section, SectionHead, Tag } from "@/components/audit/ui";
import { audit, citationCount, formatDate, hostOf, requireModule, sourceNumber } from "@/lib/content";

export const metadata: Metadata = { title: "Sources" };

const KIND_LABEL: Record<string, string> = {
  filing: "Filing",
  investor: "Investor relations",
  "press-release": "Press release",
  news: "News",
  interview: "Interview",
  podcast: "Podcast",
  "company-site": "Company site",
  "job-posting": "Job posting",
  social: "Social",
  analyst: "Analyst",
  dataset: "Dataset",
  other: "Other",
};

export default function SourcesPage() {
  requireModule("sources");
  const groups = new Map<string, typeof audit.sources.items>();
  for (const s of audit.sources.items) groups.set(s.group, [...(groups.get(s.group) ?? []), s]);

  return (
    <Container wide>
      <PageHead
        kicker="Sources"
        title={
          <>
            Everything this read rests on, <em className="text-live-ink italic">dated and linked.</em>
          </>
        }
        sub={`${audit.sources.items.length} public sources, numbered as they’re cited across the site. Each one records the day it was read. Nothing here is inside information.`}
      />

      <Section className="pt-0">
        <div className="u-inset p-4 sm:p-5">
          <div className="u-label mb-3">How to read the labels</div>
          <ClaimLegend />
        </div>
      </Section>

      {[...groups.entries()].map(([group, items]) => (
        <Section key={group} className="pt-4">
          <SectionHead title={group} right={<span className="u-label">{items.length} sources</span>} />
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((s) => {
              const cites = citationCount.get(s.id) ?? 0;
              return (
                <article key={s.id} id={`src-${s.id}`} className="u-card flex scroll-mt-28 gap-4 p-4 sm:p-5">
                  <div className="flex flex-col items-center gap-2">
                    <CompanyLogo domain={hostOf(s.url)} name={s.publisher} size={28} />
                    <span className="u-num text-[11px] text-ink-3">[{sourceNumber.get(s.id)}]</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <a href={s.url} target="_blank" rel="noreferrer" data-print-url={s.url} className="group inline text-[14.5px] leading-snug font-medium text-ink hover:text-live-ink">
                      {s.title}
                      <ArrowUpRight className="ml-0.5 inline size-3.5 -translate-y-px text-ink-3 group-hover:text-live-ink" aria-hidden />
                    </a>
                    <div className="mt-1 text-[12.5px] text-ink-3">{s.publisher}</div>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <Tag>{KIND_LABEL[s.kind] ?? s.kind}</Tag>
                      {s.published && <Tag tone="ghost">Published {formatDate(s.published)}</Tag>}
                      <Tag tone="ghost">Accessed {formatDate(s.accessed)}</Tag>
                      {s.confidence !== "high" && <Tag tone="live">{s.confidence === "medium" ? "Medium" : "Low"} confidence</Tag>}
                      <span className="u-num ml-auto text-[11px] text-ink-3">
                        cited {cites}×
                      </span>
                    </div>
                    {s.note && <p className="mt-2.5 text-[12.5px] leading-[1.5] text-ink-2">{s.note}</p>}
                    <div className="mt-2 truncate font-mono text-[11px] text-ink-3">{hostOf(s.url)}</div>
                  </div>
                </article>
              );
            })}
          </div>
        </Section>
      ))}

      {audit.sources.caveats.length > 0 && (
        <Section>
          <SectionHead n="Caveats" title="Where sources disagree, or need a warning" sub="Noted rather than quietly resolved." />
          <ul className="u-card u-rows overflow-hidden">
            {audit.sources.caveats.map((c) => (
              <li key={c.text} className="px-5 py-3.5">
                <Fact fact={c} as="p" className="text-[14px] leading-[1.6] text-ink-2" />
              </li>
            ))}
          </ul>
        </Section>
      )}
    </Container>
  );
}
