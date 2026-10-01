import { Fact } from "@/components/audit/Fact";
import { Container, Section, SectionHead } from "@/components/audit/ui";
import Hero from "@/components/hero/Hero";
import {
  CompanySummary,
  CompetitorsSummary,
  FitSummary,
  IdeasSummary,
  RecordSummary,
  SourcesSummary,
  WorkflowsSummary,
} from "@/components/overview/Summaries";
import { audit } from "@/lib/content";

/**
 * The whole thesis on one scroll: what the company is and how it makes money
 * (the hero), the numbers that matter, the three things I'd say in two
 * minutes, then each chapter's strongest picture. Every chapter has its own
 * page for depth.
 */
export default function Overview() {
  const { thesis } = audit.company;
  const on = audit.config.modules;
  return (
    <>
      <Hero />
      <Container wide>
        <Section id="thesis" className="pt-6 sm:pt-10">
          <SectionHead n="If I had two minutes" title={thesis.headline} />
          <ol className="grid gap-4 md:grid-cols-3">
            {thesis.points.map((p, i) => (
              <li key={p.title} className="u-card u-reveal relative p-6" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="u-num mb-5 text-[12px] text-live-ink">0{i + 1}</div>
                <h3 className="text-[17px] leading-snug font-semibold tracking-[-0.01em] text-ink">{p.title}</h3>
                <Fact fact={p.fact} as="p" className="u-prose mt-3 text-[14.5px]" />
              </li>
            ))}
          </ol>
        </Section>

        <Section id="chapters" className="pt-2">
          <SectionHead n="The read, chapter by chapter" title="Everything else, at a glance" sub="Each card is the strongest picture from its chapter. Open any of them for the full read, the sources and the reasoning." />
          <div className="grid gap-4 lg:grid-cols-2">
            {on.company && <CompanySummary />}
            {on.workflows && <WorkflowsSummary />}
            {on.record && <RecordSummary />}
            {on.competitors && <CompetitorsSummary />}
            {on.ideas && <IdeasSummary />}
            {on.sources && <SourcesSummary />}
            {on.fit && <FitSummary />}
          </div>
        </Section>
      </Container>
    </>
  );
}
