import { z } from "zod";

/**
 * Shared building blocks for the content schemas. No module here knows about
 * prep; lib/schema/prep.ts builds on these, never the other way round.
 */

// ── Ids and dates ────────────────────────────────────────────────────────────

export const Id = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Ids are lowercase kebab-case, e.g. \"q2-letter\"");

/** "2025", "2025-06" or "2025-06-14". */
export const PartialDate = z
  .string()
  .regex(/^\d{4}(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\d|3[01]))?)?$/, "Use YYYY, YYYY-MM or YYYY-MM-DD");

export const Day = z
  .string()
  .regex(/^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/, "Use YYYY-MM-DD");

export const Month = z.string().regex(/^\d{4}-(?:0[1-9]|1[0-2])$/, "Use YYYY-MM");

export const Domain = z
  .string()
  .regex(/^(?!https?:)(?:[a-z0-9-]+\.)+[a-z]{2,}$/i, "A bare domain like \"acme.com\" (no protocol, no path)");

export const Url = z.url({ protocol: /^https?$/ });

export const HexColor = z.string().regex(/^#[0-9a-f]{6}$/i, "A six-digit hex colour like #3355ff");

// ── Plain text: no naked figures ─────────────────────────────────────────────

/**
 * A figure: money, a percentage, a magnitude (12M, 3.4bn, 5x), a grouped
 * number (12,000) or a spelled-out scale ("2 million"). Years, quarters,
 * day counts and small counts are fine in plain text.
 */
export const FIGURE =
  /[$€£¥]\s?\d[\d.,]*(?:\s?(?:k|m|mm|bn|b|t)\b)?|\d+(?:[.,]\d+)?\s?%|\b\d+(?:[.,]\d+)?\s?(?:k|m|mm|bn|b|t|x)\b|\b\d{1,3}(?:,\d{3})+\b|\b\d+(?:\.\d+)?\s?(?:thousand|million|billion|trillion|percent)\b/i;

export function findFigure(s: string): string | null {
  const m = s.match(FIGURE);
  return m ? m[0] : null;
}

/**
 * Plain text: titles, labels, names, owners. It may not carry a figure,
 * because a figure is a claim and a claim needs a label. Put numbers in a
 * Fact (sourced/read/model) instead.
 */
export const Plain = z
  .string()
  .min(1, "Required")
  .superRefine((s, ctx) => {
    const fig = findFigure(s);
    if (fig) {
      ctx.addIssue({
        code: "custom",
        message: `Naked figure "${fig}" in plain text. Numbers are claims: move it into a sourced(), read() or model() fact so it carries a label.`,
      });
    }
  });

// ── Claims ───────────────────────────────────────────────────────────────────

const Text = z.string().min(3, "Too short to be a claim");

export const SourcedFact = z.strictObject({
  basis: z.literal("sourced"),
  text: Text,
  sources: z.array(Id).min(1, "A sourced fact needs at least one source id"),
  quote: z.boolean().optional(),
  speaker: z.string().optional(),
  note: z.string().optional(),
});

export const InferredFact = z.strictObject({
  basis: z.literal("inferred"),
  text: Text,
  sources: z.array(Id).optional(),
  note: z.string().optional(),
});

export const IllustrativeFact = z.strictObject({
  basis: z.literal("illustrative"),
  text: Text,
  note: z.string().optional(),
});

export const Fact = z.discriminatedUnion("basis", [SourcedFact, InferredFact, IllustrativeFact], {
  error: "Every claim needs a label: build it with sourced(), quote(), read() or model() from @/lib/claims",
});

const StatValue = z.string().min(1).max(24, "Keep the headline figure short; put the detail in the label");

export const Stat = z.discriminatedUnion("basis", [
  SourcedFact.extend({ value: StatValue }),
  InferredFact.extend({ value: StatValue }),
  IllustrativeFact.extend({ value: StatValue }),
]);

/** A sourced fact, and only a sourced fact: for things the company said. */
export const SaidFact = SourcedFact;

/** 0–100 on a positioning axis. */
export const Point = z.strictObject({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) });

export const Level = z.enum(["high", "medium", "low"]);

export type FactT = z.infer<typeof Fact>;
export type StatT = z.infer<typeof Stat>;
