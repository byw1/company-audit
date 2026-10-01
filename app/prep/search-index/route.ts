import { NextResponse } from "next/server";
import { getPrep } from "@/lib/prep/content";
import type { SearchItem } from "@/lib/search-types";
import { getView } from "@/lib/view";

/**
 * PREP ONLY. The prep view's extra ⌘K items. Middleware 404s /prep for anyone
 * without the key; the share preview 404s here too.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const { share } = await getView();
  const prep = share ? null : await getPrep();
  if (!prep) return new NextResponse("Not found", { status: 404 });
  const items: SearchItem[] = [
    { id: "prep-home", kind: "Prep", label: "Prep: the whole sheet", href: "/prep" },
    ...prep.likelyQuestions.map((q, i) => ({ id: `prep-q-${i}`, kind: "Prep" as const, label: q.q, hint: "Likely question", href: `/prep#q-${i}` })),
    ...prep.pushback.map((p, i) => ({ id: `prep-p-${i}`, kind: "Prep" as const, label: p.push, hint: "Pushback", href: `/prep#push-${i}` })),
    ...prep.whosWho.map((w, i) => ({ id: `prep-w-${i}`, kind: "Prep" as const, label: w.name, hint: w.title, href: `/prep#who-${i}` })),
    ...prep.questionsForThem.map((q, i) => ({ id: `prep-ask-${i}`, kind: "Prep" as const, label: q.q, hint: "Question for them", href: `/prep#ask-${i}` })),
  ];
  return NextResponse.json(items, { headers: { "Cache-Control": "private, no-store" } });
}
