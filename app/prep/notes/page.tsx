import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NotesWindow from "@/components/prep/NotesWindow";
import { CHAPTERS } from "@/lib/chapters";
import { getPrep, talkTrackByChapter } from "@/lib/prep/content";
import { getView } from "@/lib/view";

export const metadata: Metadata = { title: "Notes" };

/** PREP ONLY. The pop-out talk track: follows the presenting window, for a second screen. */
export default async function NotesPage() {
  const { share } = await getView();
  if (share) notFound();
  const prep = await getPrep();
  if (!prep) notFound();
  const labels = Object.fromEntries(CHAPTERS.map((c) => [c.id, c.kicker]));
  return <NotesWindow notes={talkTrackByChapter(prep)} labels={labels} />;
}
