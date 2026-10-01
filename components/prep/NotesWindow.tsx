"use client";

import { useEffect, useState } from "react";
import NoteCard from "./NoteCard";
import { NOTES_CHANNEL, type NotesByChapter } from "./notes";

/** PREP ONLY. Large-type notes that follow whichever chapter the main window is showing. */
export default function NotesWindow({ notes, labels }: { notes: NotesByChapter; labels: Record<string, string> }) {
  const order = Object.keys(labels).filter((k) => notes[k]?.length);
  const [chapter, setChapter] = useState(order[0] ?? "overview");
  const [linked, setLinked] = useState(false);

  useEffect(() => {
    // The pop-out is its own window: never in presenter mode, even if the opener was.
    document.documentElement.removeAttribute("data-present");
    try {
      sessionStorage.removeItem("audit-present");
    } catch {}
    if (!("BroadcastChannel" in window)) return;
    const ch = new BroadcastChannel(NOTES_CHANNEL);
    ch.onmessage = (e) => {
      if (typeof e.data?.chapter === "string") {
        setChapter(e.data.chapter);
        setLinked(true);
      }
    };
    ch.postMessage({ hello: true });
    return () => ch.close();
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-page p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded bg-ink px-1.5 py-px font-mono text-[9.5px] tracking-[0.1em] text-page uppercase">Prep only</span>
        <span className={`size-2 rounded-full ${linked ? "bg-live" : "bg-line-strong"}`} title={linked ? "Following the main window" : "Waiting for the main window"} />
        <span className="text-[12px] text-ink-3">{linked ? "Following" : "Open the site in another window"}</span>
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {order.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setChapter(k)}
            className={`rounded-md px-2 py-1 text-[12px] ${k === chapter ? "bg-ink text-page" : "bg-inset text-ink-2 hover:text-ink"}`}
          >
            {labels[k]}
          </button>
        ))}
      </div>
      <h1 className="u-display mb-4 text-[34px] text-ink">{labels[chapter] ?? chapter}</h1>
      <div className="space-y-3">
        {(notes[chapter] ?? []).map((n, i) => (
          <NoteCard key={i} note={n} large />
        ))}
        {!(notes[chapter] ?? []).length && <p className="text-[15px] text-ink-3">No note for this chapter.</p>}
      </div>
    </div>
  );
}
