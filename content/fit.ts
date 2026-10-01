import type { FitInput } from "@/lib/schema/public";

/**
 * OPTIONAL, off by default (modules.fit in audit.config.ts). A short close,
 * not the point of the site: each JD requirement against my evidence.
 *
 * Anything about me follows the guardrails in CLAUDE.md. Evidence comes from
 * my own records (Hired search_me and the master context), never from
 * resumes already sent.
 *
 * FICTIONAL EXAMPLE: placeholder rows to show the format.
 */
export default {
  headline: "Where my record meets the posting.",
  rows: [
    {
      requirement: "cross-functional",
      evidence: "Replace with a real program you ran across product, finance and policy teams, with its real outcome.",
      proof: ["Example proof point"],
    },
    {
      requirement: "scale",
      evidence: "Replace with a real example of scaling operations through process, automation or a partner.",
      proof: ["Example proof point"],
    },
  ],
  close:
    "Replace with two or three sentences on why this role, written to be read aloud. Email and LinkedIn are in the footer.",
} satisfies FitInput;
