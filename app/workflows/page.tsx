import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Fact } from "@/components/audit/Fact";
import { Container, LevelMeter, PageHead, Section, SectionHead } from "@/components/audit/ui";
import { audit, requireModule } from "@/lib/content";
import { TLink } from "@/lib/mode";

export const metadata: Metadata = { title: "Workflow maps" };

const SEVERITY = ["high", "medium", "low"] as const;

export default function WorkflowsPage() {
  requireModule("workflows");
  const { company } = audit.config;
  const workflowsFor = (resp: string) => audit.workflows.filter((w) => w.jd.includes(resp));

  return (
    <Container wide>
      <PageHead
        kicker="Workflow maps"
        title={
          <>
            Every line of the role is a workflow. <em className="text-live-ink italic">Each one leaks somewhere.</em>
          </>
        }
        sub={
          <>
            {audit.workflows.length} workflows, mapped from the {audit.role.responsibilities.length} responsibilities in the posting. How this kind of
            business works is public; how {company.name} staffs each stage is my read from the outside, and labelled as one.
          </>
        }
      />

      <Section className="pt-0">
        <SectionHead n="From the posting to the work" title="The JD, line by line" sub="Each responsibility, in the posting’s own words, and the workflows it becomes." />
        <div className="u-card u-rows overflow-hidden">
          {audit.role.responsibilities.map((r) => {
            const wfs = workflowsFor(r.id);
            return (
              <div key={r.id} id={`jd-${r.id}`} className="grid scroll-mt-28 gap-3 px-5 py-4 md:grid-cols-[11rem_minmax(0,1fr)_minmax(0,16rem)] md:gap-6">
                <div className="text-[13.5px] font-medium text-ink">{r.area}</div>
                <Fact fact={r.jd} as="p" className="text-[14px] leading-[1.55] text-ink-2" />
                <div className="flex flex-wrap content-start gap-1.5">
                  {wfs.length ? (
                    wfs.map((w) => (
                      <TLink key={w.id} href={`/workflows/${w.id}`} className="rounded-md border border-line bg-inset px-2 py-0.5 text-[12px] text-ink-2 transition-colors hover:border-line-strong hover:text-ink">
                        {w.name}
                      </TLink>
                    ))
                  ) : (
                    <span className="text-[12px] text-ink-3">Not mapped</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section>
        <SectionHead n="The workflows" title="Stages, owners, leaks, and the first change I’d make" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {audit.workflows.map((w, i) => {
            const bySeverity = SEVERITY.map((s) => [s, w.leaks.filter((l) => l.severity === s).length] as const).filter(([, n]) => n);
            return (
              <article key={w.id} className="u-card u-reveal flex flex-col p-5" style={{ transitionDelay: `${(i % 3) * 60}ms` }}>
                <div className="u-num text-[11px] text-ink-3">
                  {String(i + 1).padStart(2, "0")} · {w.stages.length} stages
                </div>
                <h3 className="mt-2 text-[17px] leading-snug font-semibold tracking-[-0.01em] text-ink">
                  <TLink href={`/workflows/${w.id}`} className="hover:text-live-ink">
                    {w.name}
                  </TLink>
                </h3>
                <Fact fact={w.oneLiner} as="p" className="mt-2 flex-1 text-[13.5px] leading-[1.55] text-ink-2" />
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line-soft pt-3">
                  {bySeverity.map(([s, n]) => (
                    <span key={s} className="inline-flex items-center gap-1.5">
                      <LevelMeter level={s} label="Leak severity" />
                      <span className="u-num text-[11.5px] text-ink-3">×{n}</span>
                    </span>
                  ))}
                  <TLink href={`/workflows/${w.id}`} className="group ml-auto inline-flex items-center gap-1 text-[12.5px] font-medium text-ink-2 hover:text-live-ink">
                    Map <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </TLink>
                </div>
              </article>
            );
          })}
        </div>
      </Section>
    </Container>
  );
}

