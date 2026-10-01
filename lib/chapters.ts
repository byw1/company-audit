/**
 * The chapters of an audit, in reading order. Each module can be switched off
 * in content/audit.config.ts; the overview is always on. Navigation, the ⌘K
 * palette and presenter mode all walk this list.
 */
export const CHAPTERS = [
  { id: "overview", href: "/", label: "Overview", kicker: "Overview" },
  { id: "company", href: "/company", label: "Company", kicker: "How it’s set up" },
  { id: "workflows", href: "/workflows", label: "Workflows", kicker: "Workflow maps" },
  { id: "record", href: "/record", label: "Record", kicker: "Public record" },
  { id: "competitors", href: "/competitors", label: "Competitors", kicker: "Competitive landscape" },
  { id: "ideas", href: "/ideas", label: "Ideas", kicker: "What I’d do" },
  { id: "sources", href: "/sources", label: "Sources", kicker: "Sources" },
  { id: "fit", href: "/fit", label: "Fit", kicker: "Fit" },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]["id"];
export type ModuleId = Exclude<ChapterId, "overview">;

export const CHAPTER_IDS = CHAPTERS.map((c) => c.id) as [ChapterId, ...ChapterId[]];
export const MODULE_IDS = CHAPTER_IDS.filter((c) => c !== "overview") as [ModuleId, ...ModuleId[]];

export type Chapter = (typeof CHAPTERS)[number];

/** The chapter a pathname belongs to (/workflows/returns → workflows). */
export function chapterFor(pathname: string): Chapter | undefined {
  if (pathname === "/") return CHAPTERS[0];
  return CHAPTERS.find((c) => c.href !== "/" && (pathname === c.href || pathname.startsWith(`${c.href}/`)));
}
