import type { Metadata } from "next";
import { ClaimLabel, Fact } from "@/components/audit/Fact";
import { Container, PageHead, Section, SectionHead } from "@/components/audit/ui";
import ImpactEffort, { rankedIdeas } from "@/components/charts/ImpactEffort";
import { audit, competitorById, ideaById, recordById, requireModule, workflowById } from "@/lib/content";
import { TLink } from "@/lib/mode";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "What I’d do" };

/** Resolve "leak:<wf>/<leak>", "record:<id>", "competitor:<id>" into a label and a link. */
function trace(t: string) {
  const [kind, ref] = t.split(":");
  if (kind === "leak") {
    const [wf, leak] = ref.split("/");
    const w = workflowById.get(wf)!;
    const l = w.leaks.find((x) => x.id === leak)!;
    const stage = w.stages.find((s) => s.id === l.at)!;
    return { kind: "Workflow leak", label: `${w.name}: ${stage.name}`, href: `/workflows/${wf}#leak-${leak}`, on: audit.config.modules.workflows };
  }
  if (kind === "record") {
    const r = recordById.get(ref)!;
    return { kind: "Stated plan", label: r.title, href: `/record#rec-${ref}`, on: audit.config.modules.record };
  }
  const c = competitorById.get(ref)!;
  return { kind: "Competitor move", label: c.name, href: `/competitors#c-${ref}`, on: audit.config.modules.competitors };
}

function Pips({ n, label }: { n: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-2" title={`${label}: ${n} of 5`}>
      <span className="u-label">{label}</span>
      <span className="inline-flex gap-[3px]" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={cn("h-[6px] w-[10px] rounded-[2px]", i <= n ? (label === "Impact" ? "bg-ink" : "bg-ink-3") : "bg-line")} />
        ))}
      </span>
      <span className="sr-only">
        {n} of 5
      </span>
    </span>
  );
}

const WINDOW_LABEL = { "30": "Days 1–30", "60": "Days 31–60", "90": "Days 61–90" } as const;

export default function IdeasPage() {
  requireModule("ideas");
  const ideas = rankedIdeas();
  const plan = [...audit.ideas.plan].sort((a, b) => Number(a.window) - Number(b.window));

  return (
    <Container wide>
      <PageHead
        kicker="What I’d do"
        title={
          <>
            Initiatives, ranked, <em className="text-live-ink italic">each traced to something real.</em>
          </>
        }
        sub="Every idea comes from a leak in a workflow, something the company has said publicly, or a competitor’s move, and links back to it. Impact and effort are my estimates from the outside."
      />

      <Section className="pt-0">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div className="u-card p-4 sm:p-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="u-label">Impact against effort</span>
              <ClaimLabel basis="inferred" />
            </div>
            <ImpactEffort />
          </div>
          <ol className="u-card u-rows self-start overflow-hidden">
            {ideas.map((i) => (
              <li key={i.id} className="flex items-center gap-3 px-4 py-3">
                <span className={cn("u-num inline-grid size-6 shrink-0 place-items-center rounded-full text-[11px]", i.impact > 3 && i.effort < 3 ? "bg-live text-live-contrast" : "bg-ink text-page")}>
                  {i.rank}
                </span>
                <a href={`#idea-${i.id}`} className="min-w-0 flex-1 truncate text-[14px] font-medium text-ink hover:text-live-ink">
                  {i.title}
                </a>
                <span className="hidden shrink-0 sm:block">
                  <span className="u-num text-[11.5px] text-ink-3">
                    impact {i.impact} · effort {i.effort}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section>
        <SectionHead n="The initiatives" title="What each one is, and what it rests on" />
        <div className="grid gap-4 lg:grid-cols-2">
          {ideas.map((i) => (
            <article key={i.id} id={`idea-${i.id}`} className="u-card u-reveal flex scroll-mt-28 flex-col p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="u-num mt-0.5 inline-grid size-7 shrink-0 place-items-center rounded-full bg-ink text-[12px] text-page">{i.rank}</span>
                <h3 className="text-[17px] leading-snug font-semibold tracking-[-0.01em] text-ink">{i.title}</h3>
              </div>
              <Fact fact={i.summary} as="p" className="mt-3 text-[14.5px] leading-[1.6] text-ink-2" />
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                <Pips n={i.impact} label="Impact" />
                <Pips n={i.effort} label="Effort" />
                <ClaimLabel basis="inferred" compact />
              </div>
              <div className="mt-4 border-t border-line-soft pt-3">
                <div className="u-label mb-2">Traces to</div>
                <ul className="flex flex-wrap gap-1.5">
                  {i.traces.map((t) => {
                    const r = trace(t);
                    const body = (
                      <>
                        <span className="text-ink-3">{r.kind} ·</span> {r.label}
                      </>
                    );
                    return (
                      <li key={t}>
                        {r.on ? (
                          <TLink href={r.href} className="inline-block rounded-md border border-line bg-inset px-2 py-0.5 text-[12px] text-ink-2 transition-colors hover:border-line-strong hover:text-ink">
                            {body}
                          </TLink>
                        ) : (
                          <span className="inline-block rounded-md border border-line bg-inset px-2 py-0.5 text-[12px] text-ink-2">{body}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="mt-auto pt-4 text-[13px] text-ink-2">
                <span className="u-label mr-2">How I’d know</span>
                {i.measure}
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section id="plan">
        <SectionHead n="First ninety days" title="The sequence" sub="A plan written from the outside is a hypothesis. The first month is for finding out where this one is wrong." />
        <ol className="grid gap-4 lg:grid-cols-3">
          {plan.map((p, n) => (
            <li key={p.window} className="u-card u-reveal relative flex flex-col p-5 sm:p-6" style={{ transitionDelay: `${n * 80}ms` }}>
              <div className="flex items-center gap-2">
                <span className={cn("size-2 rounded-full", n === 0 ? "bg-live" : "bg-line-strong")} aria-hidden />
                <span className="u-label">{WINDOW_LABEL[p.window]}</span>
              </div>
              <h3 className="u-display mt-3 text-[26px] text-ink">{p.title}</h3>
              <p className="mt-2 text-[14px] leading-[1.55] text-ink-2">{p.goal}</p>
              <ul className="mt-4 space-y-2 border-t border-line-soft pt-4">
                {p.actions.map((a) => (
                  <li key={a} className="flex gap-2.5 text-[13.5px] leading-[1.5] text-ink">
                    <span className="mt-[7px] size-1 shrink-0 rounded-full bg-ink-3" aria-hidden />
                    {a}
                  </li>
                ))}
              </ul>
              {p.ideas.length > 0 && (
                <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
                  {p.ideas.map((id) => (
                    <a key={id} href={`#idea-${id}`} className="rounded-md bg-inset px-2 py-0.5 text-[11.5px] text-ink-2 hover:text-ink">
                      {ideaById.get(id)?.title}
                    </a>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ol>
      </Section>
    </Container>
  );
}
