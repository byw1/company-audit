import "server-only";
import { RegisterSearchItems } from "@/components/shell/search-context";
import { CHAPTERS } from "@/lib/chapters";
import { prep, talkTrackByChapter } from "@/lib/prep/content";
import type { SearchItem } from "@/lib/search-types";
import { getView } from "@/lib/view";
import TalkTrackDrawer from "./TalkTrackDrawer";

/**
 * The only door from public code into prep content (see eslint.config.mjs).
 * The server decides the view; in the share view this renders nothing, so no
 * prep string is ever serialized into the page, the RSC payload or a client
 * prop.
 */
export default async function PrepLayer() {
  const { share } = await getView();
  if (share) return null;

  const items: SearchItem[] = [
    { id: "prep-home", kind: "Prep", label: "Prep: the whole sheet", href: "/prep" },
    ...prep.likelyQuestions.map((q, i) => ({ id: `prep-q-${i}`, kind: "Prep" as const, label: q.q, hint: "Likely question", href: `/prep#q-${i}` })),
    ...prep.pushback.map((p, i) => ({ id: `prep-p-${i}`, kind: "Prep" as const, label: p.push, hint: "Pushback", href: `/prep#push-${i}` })),
    ...prep.whosWho.map((w, i) => ({ id: `prep-w-${i}`, kind: "Prep" as const, label: w.name, hint: w.title, href: `/prep#who-${i}` })),
    ...prep.questionsForThem.map((q, i) => ({ id: `prep-ask-${i}`, kind: "Prep" as const, label: q.q, hint: "Question for them", href: `/prep#ask-${i}` })),
  ];
  const labels = Object.fromEntries(CHAPTERS.map((c) => [c.id, c.kicker]));

  return (
    <>
      <RegisterSearchItems id="prep" items={items} />
      <TalkTrackDrawer notes={talkTrackByChapter()} labels={labels} />
    </>
  );
}
