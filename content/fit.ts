import type { FitInput } from "@/lib/schema/public";

/**
 * OPTIONAL, off by default (modules.fit in audit.config.ts). A short close,
 * not the point of the site: each JD requirement against my evidence.
 *
 * Anything about the author follows content/author.md. Evidence comes from
 * the sources it names, never from resumes already sent. Unlike prep, this
 * page is public when switched on.
 *
 * FICTIONAL EXAMPLE: empty until fit is switched on for a real audit.
 */
export default {
  headline: "Where my record meets the posting.",
  // One row per JD requirement id in role.ts, e.g.
  // { requirement: "scale", evidence: "A real example, with its real outcome.", proof: ["Where it happened"] },
  rows: [],
  close:
    "Replace with two or three sentences on why this role, written to be read aloud. Email and LinkedIn are in the footer.",
} satisfies FitInput;
