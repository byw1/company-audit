import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/audit/ui";
import NoteCard from "@/components/prep/NoteCard";
import { CHAPTERS } from "@/lib/chapters";
import { audit, requirementById, sourceById, sourceNumber } from "@/lib/content";
import { TLink } from "@/lib/mode";
import { getPrep, talkTrackByChapter } from "@/lib/prep/content";
import { getView } from "@/lib/view";

export const metadata: Metadata = { title: "Prep" };

/**
 * PREP ONLY. Middleware 404s /prep for anyone without the key, and this page
 * 404s again in the share preview, so the check never rests on one layer.
 */
export default async function PrepPage() {
  const { share } = await getView();
  if (share) notFound();
  const prep = await getPrep();
  if (!prep) notFound();
  const notes = talkTrackByChapter(prep);
  const chapters = CHAPTERS.filter((c) => notes[c.id]?.length);

  return (
    <Container className="pt-10 pb-24 sm:pt-14">
      <div className="inline-flex items-center gap-2 rounded-full border border-live-line bg-live-tint px-3 py-1 text-[12px] text-live-ink">
        Prep only · never shared
      </div>
      <h1 className="u-display mt-4 text-[44px] text-ink sm:text-[60px]">The interview, rehearsed.</h1>
      <p className="u-prose mt-4 max-w-[64ch] text-[16px]">
        For the {audit.config.role.title} conversation with {audit.config.company.name}. The talk track, the questions, the pushback and the
        gaps, who’s who, and what to ask them. None of this is on the public site.
      </p>
      <nav className="no-print mt-6 flex flex-wrap gap-2 text-[12.5px]">
        {[
          ["#talk-track", "Talk track"],
          ["#questions", "Likely questions"],
          ["#pushback", "Pushback"],
          ["#gaps", "Gaps"],
          ["#who", "Who’s who"],
          ["#ask", "Questions for them"],
          ["#cold", "Know cold"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="rounded-md border border-line bg-surface px-2.5 py-1 text-ink-2 hover:border-line-strong hover:text-ink">
            {label}
          </a>
        ))}
        <a href="/prep/notes" target="audit-notes" className="rounded-md border border-line bg-surface px-2.5 py-1 text-ink-2 hover:border-line-strong hover:text-ink">
          Pop-out notes ↗
        </a>
      </nav>

      <Block id="talk-track" title="Talk track" sub="Share the screen, press P, and walk the chapters in this order. Stop to ask at each step.">
        <ol className="space-y-3">
          {chapters.map((c, i) => (
            <li key={c.id} className="grid gap-3 md:grid-cols-[200px_1fr] md:gap-6">
              <div>
                <div className="u-num text-[11px] text-live-ink">{String(i + 1).padStart(2, "0")}</div>
                <TLink href={c.href} className="mt-1 block text-[14.5px] font-medium text-ink hover:text-live-ink">
                  {c.kicker} →
                </TLink>
              </div>
              <div className="space-y-2">
                {notes[c.id].map((n, j) => (
                  <NoteCard key={j} note={n} />
                ))}
              </div>
            </li>
          ))}
        </ol>
      </Block>

      {prep.likelyQuestions.length > 0 && (
        <Block id="questions" title="Likely questions" sub="Outlines, not scripts. Each ends on a story or on something they can look at.">
          <div className="space-y-2">
            {prep.likelyQuestions.map((q, i) => (
              <details key={i} id={`q-${i}`} className="group u-card scroll-mt-24">
                <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4 px-5 py-4 text-[15px] font-medium text-ink">
                  {q.q}
                  <span className="text-live-ink transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <div className="border-t border-line-soft px-5 py-4">
                  <p className="text-[14.5px] leading-[1.6] text-ink-2">{q.outline}</p>
                  {q.story && (
                    <p className="mt-3 text-[13.5px] text-ink">
                      <span className="u-label mr-1.5 text-live-ink">Story</span>
                      {q.story}
                    </p>
                  )}
                </div>
              </details>
            ))}
          </div>
        </Block>
      )}

      {prep.pushback.length > 0 && (
        <Block id="pushback" title="The pushback, pre-aired">
          <div className="grid gap-3 md:grid-cols-2">
            {prep.pushback.map((p, i) => (
              <div key={i} id={`push-${i}`} className="u-card scroll-mt-24 p-5">
                <div className="u-display text-[23px] leading-tight text-ink">“{p.push}”</div>
                <p className="mt-3 text-[14px] leading-[1.6] text-ink-2">{p.answer}</p>
              </div>
            ))}
          </div>
        </Block>
      )}

      {prep.gaps.length > 0 && (
        <Block id="gaps" title="Honest gaps" sub="Against the posting, and how I handle each one.">
          <div className="space-y-3">
            {prep.gaps.map((g, i) => {
              const req = g.requirement ? requirementById.get(g.requirement) : undefined;
              return (
                <div key={i} className="u-card p-5">
                  {req && <div className="u-label mb-2">“{req.jd.text}”</div>}
                  <p className="text-[14.5px] font-medium text-ink">{g.gap}</p>
                  <p className="mt-2 text-[14px] leading-[1.6] text-ink-2">{g.handle}</p>
                </div>
              );
            })}
          </div>
        </Block>
      )}

      {prep.whosWho.length > 0 && (
        <Block id="who" title="Who’s who">
          <div className="u-card u-rows">
            {prep.whosWho.map((w, i) => (
              <div key={i} id={`who-${i}`} className="grid scroll-mt-24 gap-1 px-5 py-4 md:grid-cols-[260px_1fr] md:gap-6">
                <div>
                  <div className="text-[14px] font-medium text-ink">{w.name}</div>
                  <div className="text-[12.5px] text-ink-3">{w.title}</div>
                </div>
                <div className="text-[13.5px] leading-[1.55] text-ink-2">{w.note}</div>
              </div>
            ))}
          </div>
        </Block>
      )}

      {prep.questionsForThem.length > 0 && (
        <Block id="ask" title="Questions for them" sub="Each one shows I read the record, and tells me something I need to know.">
          <ol className="space-y-2">
            {prep.questionsForThem.map((q, i) => {
              const s = q.source ? sourceById.get(q.source) : undefined;
              return (
                <li key={i} id={`ask-${i}`} className="u-card scroll-mt-24 p-5">
                  <p className="text-[15px] font-medium text-ink">{q.q}</p>
                  <p className="mt-2 text-[13.5px] text-ink-2">{q.why}</p>
                  {s && (
                    <a href={s.url} target="_blank" rel="noreferrer" className="mt-2 inline-block font-mono text-[11px] text-ink-3 hover:text-live-ink">
                      [{sourceNumber.get(s.id)}] {s.title}
                    </a>
                  )}
                </li>
              );
            })}
          </ol>
        </Block>
      )}

      <Block id="cold" title="Know cold">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="u-card p-5">
            <div className="u-label mb-3">Numbers</div>
            <dl className="space-y-2">
              {prep.numbers.map((n, i) => (
                <div key={i} className="grid grid-cols-[120px_1fr] gap-3">
                  <dt className="u-num text-[13px] font-semibold text-ink">{n.n}</dt>
                  <dd className="text-[13px] leading-[1.5] text-ink-2">{n.what}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="u-card p-5">
            <div className="u-label mb-3">Know, don’t lead with</div>
            <ul className="space-y-2">
              {prep.careful.map((c, i) => (
                <li key={i} className="text-[13.5px] leading-[1.55] text-ink-2">
                  · {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[var(--radius)] border border-live-line bg-live-tint p-5">
            <div className="u-label mb-3 text-live-ink">Before the call</div>
            <ul className="space-y-2.5">
              {prep.checklist.map((c, i) => (
                <li key={i} className="flex gap-3 text-[13.5px] leading-[1.55] text-ink">
                  <span className="mt-[3px] size-3.5 shrink-0 rounded-[4px] border border-ink-3" aria-hidden />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Block>
    </Container>
  );
}

function Block({ id, title, sub, children }: { id: string; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-14 scroll-mt-24 break-inside-avoid-page">
      <h2 className="u-display text-[30px] text-ink sm:text-[34px]">{title}</h2>
      {sub ? <p className="mt-2 mb-5 text-[14.5px] text-ink-2">{sub}</p> : <div className="mb-5" />}
      {children}
    </section>
  );
}
