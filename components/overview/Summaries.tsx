import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { ClaimLabel, Fact } from "@/components/audit/Fact";
import { CompanyLogo } from "@/components/audit/CompanyLogo";
import { LevelMeter } from "@/components/audit/ui";
import ImpactEffort, { rankedIdeas } from "@/components/charts/ImpactEffort";
import RevenueBars from "@/components/charts/RevenueBars";
import { Explorer, PositioningMap } from "@/components/competitors/Explorer";
import { mapPoints } from "@/components/competitors/data";
import { audit, chapters, factCounts } from "@/lib/content";
import { TLink } from "@/lib/mode";

/**
 * One card per chapter for the overview, each with that chapter's strongest
 * visual, so someone who never clicks still gets the whole read.
 */
function Card({ id, title, children, wide = false }: { id: string; title: ReactNode; children: ReactNode; wide?: boolean }) {
  const ch = chapters.find((c) => c.id === id)!;
  const n = chapters.findIndex((c) => c.id === id);
  return (
    <article className={`u-card u-reveal flex min-w-0 flex-col ${wide ? "lg:col-span-2" : ""}`}>
      <header className="flex items-center justify-between gap-3 border-b border-line-soft px-5 py-3">
        <span className="u-label">
          <span className="u-num text-ink-3">{String(n).padStart(2, "0")}</span> · {ch.kicker}
        </span>
        <TLink href={ch.href} className="group inline-flex items-center gap-1 text-[12.5px] font-medium text-ink-2 hover:text-live-ink">
          Open <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </TLink>
      </header>
      <div className="flex-1 p-5">
        <h3 className="u-display mb-4 text-[24px] leading-tight text-ink">{title}</h3>
        {children}
      </div>
    </article>
  );
}

export function CompanySummary() {
  const p = audit.role.placement;
  const chain = [...p.above.map((n) => n.label), p.reportsTo.label];
  return (
    <Card id="company" title="Where the role sits, and where the money comes from">
      <div className="mb-5 flex flex-wrap items-center gap-1.5 text-[13px]">
        {chain.map((c) => (
          <span key={c} className="inline-flex items-center gap-1.5">
            <span className="rounded-md border border-line bg-inset px-2 py-0.5 text-ink-2">{c}</span>
            <ArrowRight className="size-3 text-faint" aria-hidden />
          </span>
        ))}
        <span className="rounded-md border-2 border-live bg-live-tint px-2 py-0.5 font-medium text-ink">{audit.config.role.title}</span>
        {p.reports.length > 0 && <span className="text-ink-3">→ {p.reports.length} teams</span>}
      </div>
      <RevenueBars withDetail={false} />
    </Card>
  );
}

export function WorkflowsSummary() {
  const rows = audit.workflows.map((w) => {
    const worst = [...w.leaks].sort((a, b) => ["high", "medium", "low"].indexOf(a.severity) - ["high", "medium", "low"].indexOf(b.severity))[0];
    return { w, worst };
  });
  return (
    <Card id="workflows" title={`${audit.workflows.length} workflows, and where each one leaks`}>
      <ul className="u-rows -mx-1">
        {rows.map(({ w, worst }) => (
          <li key={w.id} className="px-1 py-3">
            <TLink href={`/workflows/${w.id}`} className="group flex items-baseline justify-between gap-3">
              <span className="text-[14px] font-medium text-ink group-hover:text-live-ink">{w.name}</span>
              <LevelMeter level={worst.severity} label="Worst leak" />
            </TLink>
            <Fact fact={worst.what} as="p" compact className="mt-1 text-[12.5px] leading-[1.5] text-ink-3" />
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function RecordSummary() {
  const first = audit.record.items[0];
  return (
    <Card id="record" title="What they’ve said, and what it means for the role">
      <blockquote className="border-l-2 border-live pl-4">
        <Fact fact={first.said} as="p" className="u-display text-[21px] leading-snug text-ink" />
      </blockquote>
      <div className="mt-4 flex items-start gap-2 text-[13.5px] leading-[1.55] text-ink-2">
        <ArrowRight className="mt-1 size-3.5 shrink-0 text-live-ink" aria-hidden />
        <Fact fact={first.implies} />
      </div>
      <p className="mt-4 text-[12.5px] text-ink-3">
        {audit.record.items.length} statements on the record · {audit.record.hiring.length} hiring signals
      </p>
    </Card>
  );
}

export function CompetitorsSummary() {
  const top = [...audit.competitors.field].sort((a, b) => ["high", "medium", "low"].indexOf(a.threat) - ["high", "medium", "low"].indexOf(b.threat))[0];
  return (
    <Card id="competitors" title="The field, and where it’s heading">
      <div className="mb-2 flex items-center gap-2">
        <ClaimLabel basis="inferred" />
        <span className="text-[12px] text-ink-3">Positions are my placement; the moves behind the arrows are sourced.</span>
      </div>
      <Explorer>
        <PositioningMap points={mapPoints()} axes={audit.competitors.axes} compact />
      </Explorer>
      <div className="mt-4 flex items-start gap-3 rounded-lg border border-line-soft bg-inset/60 p-3">
        <CompanyLogo domain={top.domain} name={top.name} size={24} />
        <div className="min-w-0 text-[13px] leading-[1.5] text-ink-2">
          <span className="font-medium text-ink">{top.name}</span> · <Fact fact={top.threatRead} compact />
        </div>
      </div>
    </Card>
  );
}

export function IdeasSummary() {
  const ideas = rankedIdeas().slice(0, 3);
  return (
    <Card id="ideas" title="What I’d do first">
      <div className="grid gap-5">
        <div className="mx-auto w-full max-w-[26rem]">
          <ImpactEffort compact />
        </div>
        <ol className="space-y-3">
          {ideas.map((i) => (
            <li key={i.id} className="flex gap-3">
              <span className="u-num mt-0.5 inline-grid size-5 shrink-0 place-items-center rounded-full bg-ink text-[10.5px] text-page">{i.rank}</span>
              <TLink href={`/ideas#idea-${i.id}`} className="text-[13.5px] leading-snug font-medium text-ink hover:text-live-ink">
                {i.title}
              </TLink>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}

export function SourcesSummary() {
  const groups = new Map<string, number>();
  for (const s of audit.sources.items) groups.set(s.group, (groups.get(s.group) ?? 0) + 1);
  return (
    <Card id="sources" title="Every claim carries its label">
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line">
        {(
          [
            ["sourced", factCounts.sourced],
            ["inferred", factCounts.inferred],
            ["illustrative", factCounts.illustrative],
          ] as const
        ).map(([b, n]) => (
          <div key={b} className="bg-surface p-3">
            <div className="u-figure text-[26px] text-ink">{n}</div>
            <div className="mt-2">
              <ClaimLabel basis={b} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[13px] leading-[1.55] text-ink-2">
        {audit.sources.items.length} sources, each dated:{" "}
        {[...groups.entries()].map(([g, n], i) => (
          <span key={g}>
            {i > 0 && ", "}
            {g.toLowerCase()} ({n})
          </span>
        ))}
        .
      </p>
    </Card>
  );
}

export function FitSummary() {
  return (
    <Card id="fit" title={audit.fit.headline}>
      <p className="u-prose text-[14px]">{audit.fit.close}</p>
    </Card>
  );
}
