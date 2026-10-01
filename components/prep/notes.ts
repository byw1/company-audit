/** PREP ONLY. Shared shape for the talk-track drawer and the pop-out notes window. */
export interface TalkNote {
  chapter: string;
  time?: string;
  say: string;
  ask?: string;
  show?: string;
}

export type NotesByChapter = Record<string, TalkNote[]>;

/** The drawer and the pop-out window talk over this channel: same origin, same browser, never the network. */
export const NOTES_CHANNEL = "audit-talk-track";
