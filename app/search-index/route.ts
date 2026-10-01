import { NextResponse } from "next/server";
import { buildSearchIndex } from "@/lib/search";

/**
 * The public ⌘K index, fetched by the palette the first time it opens rather
 * than shipped in every page. Public content only: the prep view adds its own
 * items from /prep/search-index, which middleware 404s without the key.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(buildSearchIndex(), { headers: { "Cache-Control": "private, no-store" } });
}
