"use client";

import { ExternalLink, NotebookPen, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { chapterFor } from "@/lib/chapters";
import NoteCard from "./NoteCard";
import { NOTES_CHANNEL, type NotesByChapter } from "./notes";

/**
 * PREP ONLY. Rendered by <PrepLayer> only in the prep view.
 *
 * A side drawer with the talk-track note for the chapter on screen (N to
 * toggle), and a pop-out window that follows along, for a second screen while
 * the main window is shared. Presenter mode closes the drawer, so starting a
 * screen-share never shows it by accident.
 */
export default function TalkTrackDrawer({ notes, labels }: { notes: NotesByChapter; labels: Record<string, string> }) {
  const pathname = usePathname();
  const chapter = chapterFor(pathname)?.id ?? "overview";
  const current = notes[chapter] ?? [];
  const [open, setOpen] = useState(false);
  const [presenting, setPresenting] = useState(false);

  useEffect(() => {
    try {
      setOpen(localStorage.getItem("audit-notes-open") === "1");
    } catch {}
    const html = document.documentElement;
    const sync = () => setPresenting(html.hasAttribute("data-present"));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(html, { attributes: true, attributeFilter: ["data-present"] });
    return () => mo.disconnect();
  }, []);

  // Never show notes on a screen that is being presented.
  useEffect(() => {
    if (presenting) setOpen(false);
  }, [presenting]);

  useEffect(() => {
    try {
      localStorage.setItem("audit-notes-open", open ? "1" : "0");
    } catch {}
  }, [open]);

  // Tell the pop-out window which chapter is on screen.
  useEffect(() => {
    if (!("BroadcastChannel" in window)) return;
    const ch = new BroadcastChannel(NOTES_CHANNEL);
    ch.postMessage({ chapter });
    ch.onmessage = (e) => {
      if (e.data?.hello) ch.postMessage({ chapter });
    };
    return () => ch.close();
  }, [chapter]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "n" || e.key === "N") setOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const popOut = () => window.open("/prep/notes", "audit-notes", "popup,width=460,height=760");

  return (
    <>
      {!presenting && !open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="no-print fixed right-4 bottom-4 z-40 inline-flex items-center gap-2 rounded-full border border-line bg-surface/90 px-3.5 py-2 text-[12.5px] text-ink shadow-[var(--shadow-pop)] backdrop-blur-xl hover:border-line-strong"
          title="Talk-track notes for this chapter (N)"
        >
          <NotebookPen className="size-4 text-live-ink" strokeWidth={1.75} />
          Notes
          <span className="rounded bg-inset px-1 font-mono text-[10px] text-ink-3">N</span>
        </button>
      )}
      {open && (
        <aside
          aria-label="Talk-track notes (prep only)"
          className="no-print fixed top-0 right-0 bottom-0 z-40 flex w-[min(380px,92vw)] flex-col border-l border-line bg-page/95 shadow-[var(--shadow-pop)] backdrop-blur-xl"
        >
          <div className="flex items-center gap-2 border-b border-line-soft px-4 py-3">
            <span className="rounded bg-ink px-1.5 py-px font-mono text-[9.5px] tracking-[0.1em] text-page uppercase">Prep only</span>
            <span className="text-[13px] font-medium text-ink">{labels[chapter] ?? chapter}</span>
            <button type="button" onClick={popOut} className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-ink-2 hover:bg-hover hover:text-ink" title="Open in a window that follows along, for a second screen">
              <ExternalLink className="size-3.5" /> Pop out
            </button>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close notes" className="inline-grid size-7 place-items-center rounded-md text-ink-3 hover:bg-hover hover:text-ink">
              <X className="size-4" />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {current.length === 0 ? (
              <p className="text-[13px] text-ink-3">No talk-track note for this chapter. Add one in content/prep.ts.</p>
            ) : (
              current.map((n, i) => <NoteCard key={i} note={n} />)
            )}
          </div>
          <div className="border-t border-line-soft px-4 py-2.5 font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">
            N toggles · P presents (and hides this)
          </div>
        </aside>
      )}
    </>
  );
}
