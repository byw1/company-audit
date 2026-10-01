"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useMode, withShare } from "@/lib/mode";
import type { SearchItem } from "@/lib/search-types";
import { useSearchItems } from "./search-context";

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

/**
 * ⌘K: jump to any chapter, workflow, stage, leak, competitor, record item,
 * idea, person or source. The index arrives from the server; in the share view
 * it contains public content only.
 */
export default function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const items = useSearchItems();
  const { share, prepAllowed } = useMode();

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
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search this audit"
      description="Jump to a chapter, workflow, competitor, record item, idea or source."
      className="top-[14vh] translate-y-0 border-line bg-surface sm:max-w-[640px]"
      showCloseButton={false}
    >
      <CommandInput placeholder="Search workflows, leaks, competitors, sources…" className="text-[14px]" />
      <CommandList className="max-h-[min(56vh,520px)] px-1 pb-1">
        <CommandEmpty className="py-10 text-center text-[13px] text-ink-3">Nothing matches. Try a company, a stage or a source.</CommandEmpty>
        {groups.map((g) => (
          <CommandGroup key={g.kind} heading={GROUP_LABEL[g.kind] ?? g.kind} className="[&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:tracking-[0.11em] [&_[cmdk-group-heading]]:uppercase">
            {g.items.map((i) => (
              <CommandItem
                key={i.id}
                value={`${i.label} ${i.hint ?? ""} ${i.keywords ?? ""} ${i.kind}`}
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
    </CommandDialog>
  );
}
