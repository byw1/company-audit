import type { Metadata } from "next";
import { Fact } from "@/components/audit/Fact";
import { Container, PageHead, Section } from "@/components/audit/ui";
import { audit, requireModule, requirementById } from "@/lib/content";

export const metadata: Metadata = { title: "Fit" };

/**
 * Optional, off by default. A short close, not the point of the site: each
 * requirement in the posting, against evidence from my own record.
 */
export default function FitPage() {
  requireModule("fit");
  const { fit, config } = audit;
  return (
    <Container>
      <PageHead
        kicker="Fit"
        title={fit.headline}
        sub={
          <>
            The posting’s requirements, in its own words, against evidence from my own record. Evidence is mine and checkable; references on request
            at {config.author.email}.
          </>
        }
      />
      <Section className="pt-0">
        <div className="u-card u-rows overflow-hidden">
          {fit.rows.map((r) => {
            const req = requirementById.get(r.requirement);
            return (
              <div key={r.requirement} className="grid gap-3 px-5 py-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] md:gap-8">
                <div>{req ? <Fact fact={req.jd} as="p" className="text-[14px] leading-[1.55] text-ink-2" /> : <p className="text-[14px] text-ink-2">{r.requirement}</p>}</div>
                <div>
                  <p className="text-[14.5px] leading-[1.6] text-ink">{r.evidence}</p>
                  {r.proof.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {r.proof.map((p) => (
                        <span key={p} className="rounded-md border border-line bg-inset px-2 py-0.5 text-[12px] text-ink-2">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Section>
      <Section>
        <p className="u-display max-w-[40ch] text-[26px] leading-snug text-ink sm:text-[30px]">{fit.close}</p>
        <div className="mt-6 flex flex-wrap gap-3 text-[14px]">
          <a href={`mailto:${config.author.email}`} className="rounded-full bg-ink px-5 py-2.5 font-medium text-page">
            {config.author.email}
          </a>
          <a href={config.author.linkedin} className="rounded-full border border-line-strong px-5 py-2.5 text-ink">
            LinkedIn
          </a>
        </div>
      </Section>
    </Container>
  );
}
