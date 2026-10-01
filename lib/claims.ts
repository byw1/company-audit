/**
 * Every claim on an audit site is one of three things, and says so on the page:
 *
 *   Sourced            — taken from a public source, cited by id (see content/sources.ts)
 *   Outside-in read    — my inference from public evidence, not inside knowledge
 *   Illustrative model — invented numbers that show how a mechanism works
 *
 * Content files build claims with the helpers below, so a fact can't be written
 * without its label. The Zod schemas in lib/schema reject anything else.
 */

export type Basis = "sourced" | "inferred" | "illustrative";

export interface SourcedFact {
  basis: "sourced";
  text: string;
  /** Source ids from content/sources.ts. At least one. */
  sources: string[];
  /** Verbatim words from the source. Rendered in quotation marks. */
  quote?: boolean;
  /** Who said it, for quotes. */
  speaker?: string;
  note?: string;
}

export interface InferredFact {
  basis: "inferred";
  text: string;
  /** Optional sources the inference rests on. */
  sources?: string[];
  note?: string;
}

export interface IllustrativeFact {
  basis: "illustrative";
  text: string;
  note?: string;
}

export type Fact = SourcedFact | InferredFact | IllustrativeFact;

/** A fact plus the headline figure it carries, e.g. "$412M" / "Net revenue, FY2025". */
export type Stat = Fact & { value: string };

type Ids = string | string[];
const ids = (s: Ids) => (Array.isArray(s) ? s : [s]);

/** A fact taken from one or more public sources. */
export function sourced(text: string, sources: Ids, opts: { note?: string } = {}): SourcedFact {
  return { basis: "sourced", text, sources: ids(sources), ...opts };
}

/** Words the company (or someone) actually said, verbatim, with the source. */
export function quote(text: string, sources: Ids, opts: { speaker?: string; note?: string } = {}): SourcedFact {
  return { basis: "sourced", text, sources: ids(sources), quote: true, ...opts };
}

/** My read from the outside: an inference, labelled as one. Optionally names the sources it rests on. */
export function read(text: string, opts: { sources?: Ids; note?: string } = {}): InferredFact {
  const { sources, ...rest } = opts;
  return { basis: "inferred", text, ...(sources ? { sources: ids(sources) } : {}), ...rest };
}

/** An illustrative model: invented numbers that show a mechanism, never the company's own. */
export function model(text: string, opts: { note?: string } = {}): IllustrativeFact {
  return { basis: "illustrative", text, ...opts };
}

/** Attach a headline figure to a fact: stat("$412M", sourced("Net revenue, FY2025", "nw-10k")). */
export function stat(value: string, fact: Fact): Stat {
  return { ...fact, value };
}

export const BASIS_LABEL: Record<Basis, string> = {
  sourced: "Sourced",
  inferred: "Outside-in read",
  illustrative: "Illustrative model",
};

export const BASIS_HINT: Record<Basis, string> = {
  sourced: "Taken from a public source. Follow the link to check it.",
  inferred: "My inference from public evidence. Not inside knowledge.",
  illustrative: "Invented numbers to show how a mechanism works. Not the company's figures.",
};
