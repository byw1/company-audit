import "server-only";
import { audit, chapters } from "@/lib/content";
import type { SearchItem } from "@/lib/search-types";

/**
 * The public ⌘K index: every chapter, workflow, stage, leak, JD line,
 * competitor, record item, idea, person and source, each with a deep link.
 * Built on the server from public content only; the prep view adds its own
 * items from components/prep (never from here).
 */
export function buildSearchIndex(): SearchItem[] {
  const on = audit.config.modules;
  const items: SearchItem[] = chapters.map((c) => ({ id: `ch-${c.id}`, kind: "Chapter", label: c.kicker, hint: c.href, href: c.href }));

  if (on.workflows) {
    for (const w of audit.workflows) {
      items.push({ id: `wf-${w.id}`, kind: "Workflow", label: w.name, hint: w.oneLiner.text, href: `/workflows/${w.id}` });
      for (const s of w.stages)
        items.push({ id: `st-${w.id}-${s.id}`, kind: "Stage", label: s.name, hint: `${w.name} · ${s.owner}`, href: `/workflows/${w.id}#stage-${s.id}`, keywords: s.detail.text });
      for (const l of w.leaks)
        items.push({ id: `lk-${w.id}-${l.id}`, kind: "Leak", label: l.what.text, hint: w.name, href: `/workflows/${w.id}#leak-${l.id}` });
    }
    for (const r of audit.role.responsibilities)
      items.push({ id: `jd-${r.id}`, kind: "JD line", label: r.area, hint: r.jd.text, href: `/workflows#jd-${r.id}`, keywords: r.jd.text });
  }
  if (on.competitors)
    for (const c of audit.competitors.field)
      items.push({ id: `c-${c.id}`, kind: "Competitor", label: c.name, hint: c.kind, href: `/competitors#c-${c.id}`, keywords: `${c.oneLiner.text} ${c.tags.join(" ")}` });
  if (on.record) {
    for (const r of audit.record.items)
      items.push({ id: `rec-${r.id}`, kind: "Record", label: r.title, hint: r.said.text, href: `/record#rec-${r.id}`, keywords: r.theme });
    for (const h of audit.record.hiring)
      items.push({ id: `hire-${h.id}`, kind: "Hiring", label: h.title, hint: h.team, href: `/record#hire-${h.id}` });
  }
  if (on.ideas)
    for (const i of audit.ideas.items)
      items.push({ id: `idea-${i.id}`, kind: "Idea", label: i.title, hint: i.summary.text, href: `/ideas#idea-${i.id}` });
  if (on.company)
    for (const p of audit.company.leadership)
      items.push({ id: `p-${p.name}`, kind: "Person", label: p.name, hint: p.title, href: `/company#people` });
  if (on.sources)
    for (const s of audit.sources.items)
      items.push({ id: `src-${s.id}`, kind: "Source", label: s.title, hint: s.publisher, href: `/sources#src-${s.id}` });

  return items;
}
