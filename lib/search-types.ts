/** One row in the ⌘K palette. Built on the server; the client only filters. */
export interface SearchItem {
  id: string;
  kind: "Chapter" | "Workflow" | "Stage" | "Leak" | "JD line" | "Competitor" | "Record" | "Hiring" | "Idea" | "Person" | "Source" | "Prep";
  label: string;
  hint?: string;
  href: string;
  /** Extra words to match on. */
  keywords?: string;
}
