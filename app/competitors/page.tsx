import type { Metadata } from "next";
import { ClaimLabel, Fact } from "@/components/audit/Fact";
import { Container, LevelMeter, PageHead, Section, SectionHead, StatTile } from "@/components/audit/ui";
import { CompetitorTable, Explorer, PositioningMap, type CompetitorRow } from "@/components/competitors/Explorer";
import { logoNode, mapPoints } from "@/components/competitors/data";
import { audit, describePosition, formatDate, requireModule } from "@/lib/content";

export const metadata: Metadata = { title: "Competitive landscape" };

export default function CompetitorsPage() {
  requireModule("competitors");
  const { axes, field, openings, self } = audit.competitors;
  const company = audit.config.company.name;

  const rows: CompetitorRow[] = field.map((c) => {
    const moves = [...c.moves].sort((a, b) => b.date.localeCompare(a.date));
    return {
      id: c.id,
      name: c.name,
      kind: c.kind,
      domain: c.domain,
      tags: c.tags,
      threat: c.threat,
      latest: moves[0].date,
      latestLabel: formatDate(moves[0].date),
      logo: logoNode(c.domain, c.name, 30),
      threatNode: <LevelMeter level={c.threat} label="Threat" />,
      dossier: (
        <div className="grid gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="space-y-5">
            <Fact fact={c.oneLiner} as="p" className="text-[15px] leading-[1.6] text-ink" />
            <div>
              <div className="u-label mb-2">Their moves, last twelve months</div>
              <ol className="space-y-2">
                {moves.map((m) => (
                  <li key={m.date + m.fact.text} className="grid grid-cols-[5.5rem_1fr] gap-3 text-[13.5px] leading-[1.55] text-ink-2">
                    <span className="u-num text-[12px] text-ink-3">{formatDate(m.date)}</span>
                    <Fact fact={m.fact} />
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <div className="u-label mb-2">Direction of travel</div>
              <Fact fact={c.direction} as="p" className="text-[14px] leading-[1.55] text-ink" />
              <p className="mt-1.5 text-[12px] text-ink-3">
                On the map: {describePosition(c.now)}, heading toward {describePosition(c.heading)}.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-lg border border-line-soft bg-surface p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="u-label">Threat</span>
                <LevelMeter level={c.threat} />
              </div>
              <Fact fact={c.threatRead} as="p" className="text-[13.5px] leading-[1.55] text-ink-2" />
            </div>
            <div className="rounded-lg border border-live-line bg-live-tint p-4">
              <div className="u-label mb-2 text-live-ink">What {company} should do</div>
              <Fact fact={c.response} as="p" className="text-[14px] leading-[1.55] text-ink" />
            </div>
            {c.stats.length > 0 && (
              <div className="grid grid-cols-2 gap-4 pt-1">
                {c.stats.map((s) => (
                  <StatTile key={s.value + s.text} stat={s} />
                ))}
              </div>
            )}
          </div>
        </div>
      ),
    };
  });

  return (
    <Container wide>
      <PageHead
        kicker="Competitive landscape"
        title={
          <>
            Who they compete with, <em className="text-live-ink italic">and where each one is heading.</em>
          </>
        }
        sub={
          <>
            {field.length} competitors, placed on two axes that matter for {company}. Every arrow rests on that competitor’s own public moves in the
            last twelve months; the placements are my read.
          </>
        }
      />

      <Explorer>
        <Section className="pt-0">
          <div className="u-card p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="u-label">Positioning map</span>
                <ClaimLabel basis="inferred" />
              </div>
              <span className="text-[12px] text-ink-3">Hover a company to isolate it; select one to open its dossier.</span>
            </div>
            <PositioningMap points={mapPoints()} axes={axes} />
          </div>
          <div className="mt-4 max-w-[80ch] text-[13.5px] leading-[1.55] text-ink-2">
            <span className="font-medium text-ink">{company}: </span>
            <Fact fact={self.why} />
          </div>
        </Section>

        <Section className="pt-2">
          <SectionHead n="The field" title="Every competitor, one row each" sub="Sort by threat, name or most recent move. Each row opens into a dossier: what they are, what they’ve done, where they’re going, and what to do about it." />
          <CompetitorTable rows={rows} />
        </Section>
      </Explorer>

      {openings.length > 0 && (
        <Section>
          <SectionHead n="Openings" title="Where the field leaves room" />
          <div className="grid gap-4 md:grid-cols-2">
            {openings.map((o) => (
              <div key={o.text} className="u-card u-reveal p-5">
                <Fact fact={o} as="p" className="text-[15px] leading-[1.6] text-ink" />
              </div>
            ))}
          </div>
        </Section>
      )}
    </Container>
  );
}
