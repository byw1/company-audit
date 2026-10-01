import manifestJson from "@/content/generated/logos.json";

/**
 * The logo manifest written by `npm run logos`. Lookups never fetch: a domain
 * that isn't cached renders as a monogram tile.
 */
export interface LogoEntry {
  status: "icon" | "monogram";
  /** 64px PNG under /public. */
  src?: string;
  /** 180px request (the service may return less) for icons and link previews. */
  src180?: string;
  /** The real pixel width of the large file. */
  size?: number;
  fetchedAt?: string;
  reason?: string;
}

export interface LogoManifest {
  generatedAt: string;
  entries: Record<string, LogoEntry>;
}

const manifest = manifestJson as LogoManifest;

export function normaliseDomain(domain: string) {
  return domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
}

export function logoFor(domain: string): LogoEntry {
  return manifest.entries[normaliseDomain(domain)] ?? { status: "monogram", reason: "not in manifest (run npm run logos)" };
}

/** One or two letters for a monogram: "Northwind Commerce" → "NC", "acme.com" → "A". */
export function initials(name: string) {
  const words = name
    .replace(/\.[a-z]{2,}$/i, "")
    .replace(/[^\p{L}\p{N}\s&-]/gu, " ")
    .split(/[\s-]+/)
    .filter((w) => w && w !== "&" && !/^(the|and|of|co|inc|ltd|llc)$/i.test(w));
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
