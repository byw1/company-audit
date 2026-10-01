import { ArrowDown, ArrowRight } from "lucide-react";
import { Fact } from "@/components/audit/Fact";
import { audit } from "@/lib/content";
import type { OrgNode } from "@/lib/schema/public";
import { cn } from "@/lib/utils";

/**
 * The org, drawn around the role. The role is highlighted; everything else is
 * dimmed context: the chain above it, its peers, its reports, the teams that
 * feed it (upstream) and the teams it feeds (downstream). Each node's basis is
 * listed underneath, with its label.
 */

function Node({ node, dim = true, className }: { node: OrgNode; dim?: boolean; className?: string }) {
  return (
    <a
      href={`#org-${node.id}`}
      className={cn(
        "group block min-w-0 rounded-lg border border-line bg-surface px-3 py-2 text-left transition-[opacity,border-color] hover:border-line-strong hover:opacity-100 focus-visible:opacity-100",
        dim && "opacity-70",
        className,
      )}
    >
      <span className="block truncate text-[13px] font-medium text-ink">{node.label}</span>
      {node.person && <span className="block truncate text-[11.5px] text-ink-3">{node.person}</span>}
    </a>
  );
}

function Column({ title, nodes, arrow }: { title: string; nodes: OrgNode[]; arrow: "in" | "out" }) {
  if (!nodes.length) return <div className="hidden lg:block" />;
  return (
    <div className="min-w-0">
      <div className="u-label mb-2 flex items-center gap-1.5">
        {title}
        <ArrowRight className="size-3" aria-hidden />
      </div>
      <div className="space-y-2">
        {nodes.map((n) => (
          <div key={n.id} className={cn("flex items-center gap-2", arrow === "out" && "flex-row-reverse lg:flex-row")}>
            <Node node={n} className="flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrgMap({ compact = false }: { compact?: boolean }) {
  const p = audit.role.placement;
  const roleTitle = audit.config.role.title;

  const chain = (
    <div className="flex flex-col items-center gap-1.5">
      {[...p.above, p.reportsTo].map((n) => (
        <div key={n.id} className="flex w-full max-w-[15rem] flex-col items-center gap-1.5">
          <Node node={n} className="w-full text-center" />
          <ArrowDown className="size-3.5 text-faint" aria-hidden />
        </div>
      ))}
      <div className="flex w-full flex-wrap items-stretch justify-center gap-2">
        <div
          id="org-role"
          className="w-full max-w-[17rem] scroll-mt-24 rounded-xl border-2 border-live bg-live-tint px-4 py-3 text-center shadow-[0_0_0_6px_var(--live-tint)]"
        >
          <span className="u-label block text-live-ink">This role</span>
          <span className="mt-1 block text-[14.5px] leading-tight font-semibold text-ink">{roleTitle}</span>
        </div>
      </div>
      {p.peers.length > 0 && (
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          <span className="u-label w-full text-center">Peers</span>
          {p.peers.map((n) => (
            <Node key={n.id} node={n} className="max-w-[12rem]" />
          ))}
        </div>
      )}
      {p.reports.length > 0 && (
        <>
          <ArrowDown className="mt-1 size-3.5 text-faint" aria-hidden />
          <div className="u-label">Reports</div>
          <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
            {p.reports.map((n) => (
              <Node key={n.id} node={n} className="text-center" />
            ))}
          </div>
        </>
      )}
    </div>
  );

  const groups: [string, OrgNode[]][] = [
    ["Above", p.above.concat(p.reportsTo)],
    ["Peers", p.peers],
    ["Reports", p.reports],
    ["Upstream: feeds the role", p.upstream],
    ["Downstream: the role feeds", p.downstream],
  ];

  return (
    <div>
      <div className="u-card u-dots relative overflow-hidden p-4 sm:p-6">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_minmax(0,13rem)]">
          <Column title="Upstream" nodes={p.upstream} arrow="in" />
          {chain}
          <Column title="Downstream" nodes={p.downstream} arrow="out" />
        </div>
      </div>

      {!compact && (
        <div className="mt-6 grid gap-x-8 gap-y-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <div className="u-label mb-2">This role</div>
            <Fact fact={audit.role.placement.role.note} as="p" className="u-prose text-[14px]" />
          </div>
          {groups
            .filter(([, nodes]) => nodes.length)
            .map(([title, nodes]) => (
              <div key={title}>
                <div className="u-label mb-2">{title}</div>
                <ul className="space-y-2.5">
                  {nodes.map((n) => (
                    <li key={n.id} id={`org-${n.id}`} className="scroll-mt-24 text-[13.5px] leading-[1.55] text-ink-2">
                      <span className="font-medium text-ink">{n.label}</span>
                      {n.person && <span className="text-ink-3"> · {n.person}</span>}
                      <span className="text-ink-3"> — </span>
                      <Fact fact={n.note} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
