"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useMode, withShare } from "@/lib/mode";
import type { SearchItem } from "@/lib/search-types";

const ORDER: SearchItem["kind"][] = ["Chapter", "Prep", "Workflow", "Leak", "Competitor", "Record", "Idea", "JD line", "Stage", "Hiring", "Person", "Source"];
const GROUP_LABEL: Partial<Record<SearchItem["kind"], string>> = {
  Chapter: "Chapters",
  Prep: "Prep (only you)",
  Workflow: "Workflows",
  Leak: "Leaks",
  Competitor: "Competitors",
  Record: "Public record",
  Idea: "Ideas",
  "JD line": "The JD",
  Stage: "Stages",
  Hiring: "Hiring signals",
  Person: "People",
  Source: "Sources",
};

const SEP = "\u241f";

/**
 * Every word typed must appear, whole, somewhere in the item. Matches in the
 * label rank first (earlier is better), then matches in its details. No
 * scattered-letter fuzziness: "verif" finds verification, not "Ship every…".
 */
function score(value: string, search: string, keywords?: string[]) {
  const q = search.toLowerCase().trim();
  if (!q) return 1;
  const words = q.split(/\s+/);
  const label = value.split(SEP)[0].toLowerCase();
  if (words.every((w) => label.includes(w))) return 1 - Math.min(label.indexOf(words[0]), 60) / 120;
  const all = `${label} ${(keywords ?? []).join(" ").toLowerCase()}`;
  return words.every((w) => all.includes(w)) ? 0.25 : 0;
}

/**
 * ⌘K: jump to any chapter, workflow, stage, leak, competitor, record item,
 * idea, person or source. The index arrives from the server; in the share view
 * it contains public content only.
 */
export default function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const { share, prepAllowed } = useMode();
  const [items, setItems] = useState<SearchItem[]>([]);

  // The index is fetched on first open, not shipped with every page. The prep
  // items come from behind the gate, and only in the prep view.
  useEffect(() => {
    let live = true;
    const urls = ["/search-index", ...(prepAllowed && !share ? ["/prep/search-index"] : [])];
    Promise.all(urls.map((u) => fetch(u, { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : []))))
      .then((lists: SearchItem[][]) => live && setItems(lists.flat()))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [prepAllowed, share]);

  const groups = useMemo(() => {
    const by = new Map<SearchItem["kind"], SearchItem[]>();
    for (const i of items) by.set(i.kind, [...(by.get(i.kind) ?? []), i]);
    return ORDER.filter((k) => by.has(k)).map((k) => ({ kind: k, items: by.get(k)! }));
  }, [items]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(prepAllowed && share ? withShare(href) : href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="top-[14vh] translate-y-0 gap-0 overflow-hidden border-line bg-surface p-0 shadow-[var(--shadow-pop)] sm:max-w-[640px]">
        <DialogTitle className="sr-only">Search this audit</DialogTitle>
        <DialogDescription className="sr-only">Jump to a chapter, workflow, competitor, record item, idea or source.</DialogDescription>
        <Command filter={score} className="bg-surface [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:tracking-[0.11em] [&_[cmdk-group-heading]]:text-ink-3 [&_[cmdk-group-heading]]:uppercase [&_[data-slot=command-input-wrapper]]:h-12">
          <CommandInput placeholder="Search workflows, leaks, competitors, sources…" className="text-[14px]" />
          <CommandList className="max-h-[min(56vh,520px)] px-1 pb-1">
            <CommandEmpty className="py-10 text-center text-[13px] text-ink-3">
              {items.length ? "Nothing matches. Try a company, a stage or a source." : "Loading…"}
            </CommandEmpty>
            {groups.map((g) => (
              <CommandGroup key={g.kind} heading={GROUP_LABEL[g.kind] ?? g.kind}>
                {g.items.map((i) => (
                  <CommandItem
                    key={i.id}
                    value={`${i.label}${SEP}${i.id}`}
                    keywords={[i.hint ?? "", i.keywords ?? "", i.kind]}
                    onSelect={() => go(i.href)}
                    className="gap-3 rounded-md px-2.5 py-2 data-[selected=true]:bg-hover"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] text-ink">{i.label}</span>
                      {i.hint && <span className="block truncate text-[12px] text-ink-3">{i.hint}</span>}
                    </span>
                    <span className="shrink-0 font-mono text-[9.5px] tracking-[0.1em] text-ink-3 uppercase">{i.kind}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
          <div className="flex items-center gap-4 border-t border-line-soft px-3 py-2 font-mono text-[9.5px] tracking-[0.12em] text-ink-3 uppercase">
            <span>↑↓ move</span>
            <span>↵ open</span>
            <span>esc close</span>
            <span className="ml-auto">{items.length} items</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
