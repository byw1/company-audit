import "server-only";
import { CHAPTERS } from "@/lib/chapters";
import { talkTrackByChapter } from "@/lib/prep/content";
import { getView } from "@/lib/view";
import TalkTrackDrawer from "./TalkTrackDrawer";

/**
 * The only door from public code into prep content (see eslint.config.mjs).
 * The server decides the view; in the share view this renders nothing, so no
 * prep string is ever serialized into the page, the RSC payload or a client
 * prop. (The prep view's ⌘K items come from /prep/search-index, behind the
 * same gate.)
 */
export default async function PrepLayer() {
  const { share } = await getView();
  if (share) return null;

  const labels = Object.fromEntries(CHAPTERS.map((c) => [c.id, c.kicker]));

  return (
    <TalkTrackDrawer notes={talkTrackByChapter()} labels={labels} />
  );
}
