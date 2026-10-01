import type { TalkNote } from "./notes";

/** PREP ONLY. One talk-track note. */
export default function NoteCard({ note, large = false }: { note: TalkNote; large?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      {note.time && <div className="u-num mb-2 text-[11px] text-live-ink">{note.time}</div>}
      <p className={large ? "text-[19px] leading-[1.55] text-ink" : "text-[14px] leading-[1.6] text-ink"}>{note.say}</p>
      {note.show && (
        <p className={`mt-3 text-ink-2 ${large ? "text-[15px]" : "text-[12.5px]"}`}>
          <span className="u-label mr-1.5">Show</span>
          {note.show}
        </p>
      )}
      {note.ask && (
        <p className={`mt-3 rounded-lg border border-live-line bg-live-tint px-3 py-2 text-ink ${large ? "text-[16px]" : "text-[13px]"}`}>
          <span className="u-label mr-1.5 text-live-ink">Ask</span>
          {note.ask}
        </p>
      )}
    </div>
  );
}
