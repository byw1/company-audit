import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Fact } from "@/components/audit/Fact";
import { Container, LevelMeter, Panel, Section, SectionHead, Stamp } from "@/components/audit/ui";
import WorkflowFlow, { type FlowStage } from "@/components/flow/WorkflowFlow";
import { audit, requireModule, responsibilityById, workflowById } from "@/lib/content";
import { TLink } from "@/lib/mode";
import { cn } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const w = workflowById.get(id);
  return { title: w ? w.name : "Workflow" };
}

const RANK = { high: 0, medium: 1, low: 2 } as const;

export default async function WorkflowPage({ params }: Params) {
  requireModule("workflows");
  const { id } = await params;
  const w = workflowById.get(id);
  if (!w) notFound();

  const all = audit.workflows;
  const i = all.findIndex((x) => x.id === w.id);
  const prev = all[(i - 1 + all.length) % all.length];
  const next = all[(i + 1) % all.length];

  const leaksAt = (stage: string) => w.leaks.filter((l) => l.at === stage).sort((a, b) => RANK[a.severity] - RANK[b.severity]);
  const stages: FlowStage[] = w.stages.map((s) => {
    const leaks = leaksAt(s.id);
    return { id: s.id, name: s.name, owner: s.owner, leak: leaks[0]?.severity, leakCount: leaks.length };
  });
  const stageName = new Map(w.stages.map((s) => [s.id, s.name]));

  return (
    <Container wide>
      <header className="pt-10 pb-8 sm:pt-14">
        <TLink href="/workflows" className="u-label inline-flex items-center gap-1.5 hover:text-ink">
          <ArrowLeft className="size-3" aria-hidden /> Workflow {String(i + 1).padStart(2, "0")} of {String(all.length).padStart(2, "0")}
        </TLink>
        <h1 className="u-display u-rise mt-4 max-w-[22ch] text-[40px] text-ink sm:text-[56px]">{w.name}</h1>
        <Fact fact={w.oneLiner} as="p" className="u-prose u-rise mt-4 max-w-[70ch] text-[16px] sm:text-[17px]" />
        <div className="mt-6 grid gap-2">
          {w.jd.map((r) => {
            const resp = responsibilityById.get(r)!;
            return (
              <div key={r} className="flex max-w-[78ch] gap-3 text-[13.5px] leading-[1.55] text-ink-2">
                <span className="u-label mt-[3px] shrink-0 text-live-ink">From the JD</span>
                <Fact fact={resp.jd} />
              </div>
            );
          })}
        </div>
        <Stamp className="mt-6" />
      </header>

      <WorkflowFlow stages={stages} links={w.links} />
      <p className="mt-2 text-[12px] text-ink-3">Stages left to right. Accented edges and badges mark where value leaks; dashed lines are loops back. Select a stage to jump to its detail.</p>

      <Section className="pt-12">
        <SectionHead n="Stages" title="Who holds each step" sub="The mechanics are public. Who owns each stage inside the company is my read, and labelled as one." />
        <div className="u-card u-rows overflow-hidden">
          {w.stages.map((s, n) => {
            const leaks = leaksAt(s.id);
            return (
              <div key={s.id} id={`stage-${s.id}`} className={cn("grid scroll-mt-28 gap-2 px-5 py-4 md:grid-cols-[2.5rem_13rem_11rem_minmax(0,1fr)] md:gap-5", leaks[0]?.severity === "high" && "bg-live-tint/40")}>
                <span className="u-num text-[12px] text-ink-3">{String(n + 1).padStart(2, "0")}</span>
                <span className="text-[14px] font-medium text-ink">{s.name}</span>
                <span className="text-[13px] text-ink-3">{s.owner}</span>
                <div className="text-[13.5px] leading-[1.55] text-ink-2">
                  <Fact fact={s.detail} />
                  {leaks.map((l) => (
                    <a key={l.id} href={`#leak-${l.id}`} className="mt-2 flex items-center gap-2 text-[12.5px] text-ink hover:text-live-ink">
                      <LevelMeter level={l.severity} label="Leak" /> Leak here
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <div className="grid gap-x-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Section>
          <SectionHead n="Leaks" title="Where value escapes" />
          <div className="space-y-3">
            {[...w.leaks]
              .sort((a, b) => RANK[a.severity] - RANK[b.severity])
              .map((l) => (
                <div key={l.id} id={`leak-${l.id}`} className={cn("u-card scroll-mt-28 p-5", l.severity === "high" && "border-live-line")}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <LevelMeter level={l.severity} label="Severity" />
                    <a href={`#stage-${l.at}`} className="u-label hover:text-ink">
                      At: {stageName.get(l.at)}
                    </a>
                  </div>
                  <Fact fact={l.what} as="p" className="text-[14.5px] leading-[1.55] text-ink" />
                </div>
              ))}
          </div>
        </Section>

        <Section>
          <SectionHead n="Measure" title="The numbers I’d watch" />
          <div className="grid gap-3">
            {w.kpis.map((k) => (
              <Panel key={k.name} className="p-4">
                <div className="text-[14px] font-semibold text-ink">{k.name}</div>
                <p className="mt-1 text-[13.5px] leading-[1.5] text-ink-2">{k.why}</p>
                {k.target && (
                  <div className="mt-3 border-t border-line-soft pt-2.5 text-[13px] text-ink">
                    <span className="u-label mr-2">Target</span>
                    <Fact fact={k.target} />
                  </div>
                )}
              </Panel>
            ))}
          </div>
        </Section>
      </div>

      <Section className="pt-0">
        <div className="relative overflow-hidden rounded-[var(--radius)] border border-live-line bg-live-tint p-6 sm:p-8">
          <div className="u-label text-live-ink">The first change I’d make</div>
          <Fact fact={w.firstMove} as="p" className="u-display mt-3 max-w-[48ch] text-[24px] leading-snug text-ink sm:text-[28px]" />
        </div>
      </Section>

      <nav className="flex items-center justify-between gap-4 border-t border-line-soft pt-6 pb-4 text-[13.5px]">
        <TLink href={`/workflows/${prev.id}`} className="group inline-flex min-w-0 items-center gap-2 text-ink-2 hover:text-ink">
          <ArrowLeft className="size-4 shrink-0 transition-transform group-hover:-translate-x-0.5" aria-hidden />
          <span className="truncate">{prev.name}</span>
        </TLink>
        <TLink href={`/workflows/${next.id}`} className="group inline-flex min-w-0 items-center gap-2 text-right text-ink-2 hover:text-ink">
          <span className="truncate">{next.name}</span>
          <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </TLink>
      </nav>
    </Container>
  );
}
