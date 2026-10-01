import type { Metadata } from "next";
import { ClaimChip, Fact } from "@/components/audit/Fact";
import { CompanyLogo } from "@/components/audit/CompanyLogo";
import { Container, PageHead, Panel, Section, SectionHead } from "@/components/audit/ui";
import OrgMap from "@/components/charts/OrgMap";
import RevenueBars from "@/components/charts/RevenueBars";
import Timeline from "@/components/charts/Timeline";
import { audit, formatDate, requireModule } from "@/lib/content";

export const metadata: Metadata = { title: "How it’s set up" };

export default function CompanyPage() {
  requireModule("company");
  const c = audit.company;
  const { company, role } = audit.config;

  return (
    <Container wide>
      <PageHead
        kicker="How it’s set up"
        title={
          <>
            {company.name}, <em className="text-live-ink italic">from the org chart to the revenue lines.</em>
          </>
        }
        sub={<Fact fact={c.oneLiner} />}
        aside={<CompanyLogo domain={company.iconDomain ?? company.domain} name={company.name} size={64} alt={company.name} className="hidden lg:inline-grid" />}
      />

      <Section className="pt-0">
        <div className="grid gap-x-12 gap-y-4 lg:grid-cols-2">
          {c.overview.map((f) => (
            <Fact key={f.text} fact={f} as="p" className="u-prose text-[15.5px]" />
          ))}
        </div>
      </Section>

      <Section id="org">
        <SectionHead
          n="The org, around the role"
          title={`Where the ${role.title} sits`}
          sub="The role is highlighted; everything else is context. Upstream teams feed it, downstream teams depend on it. What each box is based on is listed underneath."
        />
        <OrgMap />
      </Section>

      <Section id="model">
        <SectionHead n="Business model" title="How the money comes in" />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <ul className="space-y-4">
            {c.businessModel.map((f) => (
              <li key={f.text} className="flex gap-3">
                <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-ink-3" aria-hidden />
                <Fact fact={f} as="p" className="text-[15px] leading-[1.6] text-ink-2" />
              </li>
            ))}
          </ul>
          <Panel label="Revenue lines" className="p-0">
            <div className="p-5">
              <RevenueBars />
            </div>
          </Panel>
        </div>
      </Section>

      <div className="grid gap-x-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Section id="timeline">
          <SectionHead n="Timeline" title="How it got here" />
          <Timeline />
        </Section>

        {c.funding.length > 0 && (
          <Section id="funding">
            <SectionHead n="Funding" title="Capital raised" />
            <div className="u-card u-rows overflow-hidden">
              {c.funding.map((f) => (
                <div key={f.date + f.round} className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-baseline gap-4 px-4 py-3">
                  <span className="u-num text-[12px] text-ink-3">{formatDate(f.date)}</span>
                  <span className="min-w-0 text-[13.5px] text-ink-2">
                    <span className="font-medium text-ink">{f.round}</span> · <Fact fact={f.fact} compact />
                  </span>
                  {f.amount ? (
                    <span className="u-num text-right text-[14px] font-medium text-ink">
                      {f.amount.value}
                      <ClaimChip fact={f.amount} compact />
                    </span>
                  ) : (
                    <span />
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>

      {c.leadership.length > 0 && (
        <Section id="people">
          <SectionHead n="Leadership" title="Who runs it" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {c.leadership.map((p) => (
              <div key={p.name} className="u-card p-5">
                <div className="text-[15px] font-semibold text-ink">{p.name}</div>
                <div className="text-[12.5px] text-ink-3">{p.title}</div>
                <Fact fact={p.fact} as="p" className="mt-3 text-[13.5px] leading-[1.55] text-ink-2" />
                {p.linkedin && (
                  <a href={p.linkedin} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[12px] text-ink-3 hover:text-live-ink">
                    LinkedIn ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </Container>
  );
}
