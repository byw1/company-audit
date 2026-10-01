import { z } from "zod";
import { MODULE_IDS } from "@/lib/chapters";
import {
  Day,
  Domain,
  Fact,
  HexColor,
  Id,
  Level,
  Month,
  PartialDate,
  Plain,
  Point,
  SaidFact,
  Stat,
  Url,
} from "./primitives";

/**
 * The public content model. One schema per file in content/, plus the
 * cross-file checks (every source id exists, every workflow maps to a JD line,
 * every idea traces to something real). Prep lives in ./prep.ts and builds on
 * this; nothing here imports it.
 */

// ── audit.config.ts ──────────────────────────────────────────────────────────

export const HERO_VARIANTS = ["shader", "particles", "flywheel"] as const;

export const ConfigSchema = z.strictObject({
  company: z.strictObject({
    name: Plain,
    domain: Domain,
    /** Shown on every page when true. The template's example is fictional. */
    fictional: z.boolean().default(false),
    ticker: z.string().optional(),
  }),
  role: z.strictObject({
    title: Plain,
    team: Plain.optional(),
    location: Plain.optional(),
    jdUrl: Url,
    /** The job posting's id in sources.ts. */
    jdSource: Id,
  }),
  author: z.strictObject({
    name: Plain,
    email: z.email(),
    linkedin: Url,
  }),
  /** The month the research was done. Stamped on every page as "Researched September 2026". */
  researched: Month,
  /** Override the accent derived from the company's icon. */
  accent: HexColor.optional(),
  hero: z.strictObject({
    variant: z.enum(HERO_VARIANTS),
    /** Flywheel only: the names of the three orbits. */
    orbits: z.array(Plain).length(3).optional(),
  }),
  modules: z.strictObject(
    Object.fromEntries(MODULE_IDS.map((m) => [m, z.boolean()])) as Record<(typeof MODULE_IDS)[number], z.ZodBoolean>,
  ),
});

// ── company.ts ───────────────────────────────────────────────────────────────

const Person = z.strictObject({
  name: Plain,
  title: Plain,
  fact: Fact,
  linkedin: Url.optional(),
});

export const CompanySchema = z.strictObject({
  /** What the company is, in one sentence. */
  oneLiner: Fact,
  /** How it makes money, in one sentence. */
  model: Fact,
  /** The three or four numbers that matter. */
  stats: z.array(Stat).min(2).max(4),
  /** The whole thesis: what I'd say if I had two minutes. Exactly three points. */
  thesis: z.strictObject({
    headline: Plain,
    points: z.array(z.strictObject({ title: Plain, fact: Fact })).length(3),
  }),
  overview: z.array(Fact).min(1),
  timeline: z.array(z.strictObject({ date: PartialDate, title: Plain, fact: Fact })).min(1),
  funding: z.array(z.strictObject({ date: PartialDate, round: Plain, amount: Stat.optional(), fact: Fact })).default([]),
  leadership: z.array(Person).default([]),
  businessModel: z.array(Fact).min(1),
  revenueLines: z
    .array(
      z.strictObject({
        name: Plain,
        what: Fact,
        /** Share of revenue, 0–100, only when it's public. Never estimate a share and present it as sourced. */
        share: z.strictObject({ value: z.number().min(0).max(100), fact: Fact }).optional(),
      }),
    )
    .min(1),
});

// ── role.ts ──────────────────────────────────────────────────────────────────

const OrgNode = z.strictObject({
  id: Id,
  label: Plain,
  person: Plain.optional(),
  note: Fact,
});

export const RoleSchema = z.strictObject({
  summary: Fact,
  responsibilities: z
    .array(
      z.strictObject({
        id: Id,
        area: Plain,
        /** The JD's own words, quoted and sourced to the posting. */
        jd: SaidFact,
        read: Fact.optional(),
      }),
    )
    .min(1),
  requirements: z.array(z.strictObject({ id: Id, jd: SaidFact })).default([]),
  placement: z.strictObject({
    /** The chain above the manager, top first (e.g. CEO). */
    above: z.array(OrgNode).default([]),
    reportsTo: OrgNode,
    role: z.strictObject({ note: Fact }),
    peers: z.array(OrgNode).default([]),
    reports: z.array(OrgNode).default([]),
    upstream: z.array(OrgNode).default([]),
    downstream: z.array(OrgNode).default([]),
  }),
});

// ── workflows.ts ─────────────────────────────────────────────────────────────

export const WorkflowSchema = z.strictObject({
  id: Id,
  name: Plain,
  /** Responsibility ids from role.ts this workflow comes from. */
  jd: z.array(Id).min(1, "Map every workflow back to at least one JD responsibility"),
  oneLiner: Fact,
  stages: z
    .array(z.strictObject({ id: Id, name: Plain, owner: Plain, detail: Fact }))
    .min(2)
    .max(9, "Nine stages at most; split the workflow instead"),
  /** Extra edges beyond the left-to-right chain: loops, branches, hand-backs. */
  links: z.array(z.strictObject({ from: Id, to: Id, label: Plain.optional() })).default([]),
  leaks: z.array(z.strictObject({ id: Id, at: Id, severity: Level, what: Fact })).min(1),
  kpis: z.array(z.strictObject({ name: Plain, why: Plain, target: Fact.optional() })).min(1),
  firstMove: Fact,
});

export const WorkflowsSchema = z.array(WorkflowSchema);

// ── public-record.ts ─────────────────────────────────────────────────────────

export const RECORD_KINDS = [
  "filing",
  "letter",
  "earnings-call",
  "interview",
  "podcast",
  "press",
  "post",
  "talk",
  "job-posting",
] as const;

export const RecordSchema = z.strictObject({
  items: z
    .array(
      z.strictObject({
        id: Id,
        date: PartialDate,
        kind: z.enum(RECORD_KINDS),
        title: Plain,
        /** What they said: a verbatim quote() or a sourced() paraphrase. */
        said: SaidFact,
        /** What it implies for this role. */
        implies: Fact,
        theme: Plain.optional(),
      }),
    )
    .min(1),
  /** Their open roles, read as signals of where they're investing. */
  hiring: z
    .array(
      z.strictObject({
        id: Id,
        title: Plain,
        team: Plain,
        location: Plain.optional(),
        posted: PartialDate.optional(),
        source: Id,
        signal: Fact,
      }),
    )
    .default([]),
});

// ── competitors.ts ───────────────────────────────────────────────────────────

const Axis = z.strictObject({ label: Plain, low: Plain, high: Plain });

export const CompetitorsSchema = z.strictObject({
  axes: z.strictObject({ x: Axis, y: Axis }),
  /** Where the company itself sits and is heading, on the same axes. */
  self: z.strictObject({ now: Point, heading: Point, why: Fact }),
  field: z
    .array(
      z.strictObject({
        id: Id,
        name: Plain,
        domain: Domain,
        kind: Plain,
        tags: z.array(Plain).default([]),
        oneLiner: Fact,
        now: Point,
        heading: Point,
        threat: Level,
        /** Their own public moves in the last twelve months: the evidence for the heading. */
        moves: z.array(z.strictObject({ date: PartialDate, fact: Fact })).min(1),
        /** Where they're heading, in a sentence. */
        direction: Fact,
        threatRead: Fact,
        /** What this company should do about it. */
        response: Fact,
        stats: z.array(Stat).max(3).default([]),
      }),
    )
    .min(2),
  openings: z.array(Fact).default([]),
});

// ── ideas.ts ─────────────────────────────────────────────────────────────────

/** "leak:<workflow>/<leak>", "record:<id>" or "competitor:<id>". */
export const Trace = z
  .string()
  .regex(
    /^(?:leak:[a-z0-9-]+\/[a-z0-9-]+|record:[a-z0-9-]+|competitor:[a-z0-9-]+)$/,
    'Trace each idea to "leak:<workflow>/<leak>", "record:<id>" or "competitor:<id>"',
  );

export const IdeasSchema = z.strictObject({
  items: z
    .array(
      z.strictObject({
        id: Id,
        title: Plain,
        summary: Fact,
        /** 1–5, my estimate. */
        impact: z.int().min(1).max(5),
        /** 1–5, my estimate. */
        effort: z.int().min(1).max(5),
        traces: z.array(Trace).min(1, "Every idea traces to a workflow leak, a stated plan or a competitor move"),
        /** How I'd know it worked. */
        measure: Plain,
      }),
    )
    .min(1),
  plan: z
    .array(
      z.strictObject({
        window: z.enum(["30", "60", "90"]),
        title: Plain,
        goal: Plain,
        actions: z.array(Plain).min(1),
        ideas: z.array(Id).default([]),
      }),
    )
    .length(3),
});

// ── sources.ts ───────────────────────────────────────────────────────────────

export const SOURCE_KINDS = [
  "filing",
  "investor",
  "press-release",
  "news",
  "interview",
  "podcast",
  "company-site",
  "job-posting",
  "social",
  "analyst",
  "dataset",
  "other",
] as const;

export const SourceSchema = z.strictObject({
  id: Id,
  title: Plain,
  publisher: Plain,
  url: Url,
  kind: z.enum(SOURCE_KINDS),
  published: PartialDate.optional(),
  /** The day I read it. Required: every source is dated. */
  accessed: Day,
  /** Heading it's listed under on /sources, e.g. the company, the market, a competitor. */
  group: Plain,
  note: z.string().optional(),
  confidence: Level.default("high"),
});

export const SourcesSchema = z.strictObject({
  items: z.array(SourceSchema).min(1),
  /** Where sources disagree or need a caveat. Noted, not resolved. */
  caveats: z.array(Fact).default([]),
});

// ── fit.ts (optional, about the author) ──────────────────────────────────────

export const FitSchema = z.strictObject({
  headline: Plain,
  rows: z
    .array(
      z.strictObject({
        /** A requirement id from role.ts. */
        requirement: Id,
        evidence: z.string().min(10),
        proof: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  close: z.string().min(10),
});

// ── The whole public audit ──────────────────────────────────────────────────

export const PublicAuditSchema = z.strictObject({
  config: ConfigSchema,
  company: CompanySchema,
  role: RoleSchema,
  workflows: WorkflowsSchema,
  record: RecordSchema,
  competitors: CompetitorsSchema,
  ideas: IdeasSchema,
  sources: SourcesSchema,
  fit: FitSchema,
});

export type PublicAudit = z.infer<typeof PublicAuditSchema>;
export type AuditConfig = z.infer<typeof ConfigSchema>;
export type Company = z.infer<typeof CompanySchema>;
export type Role = z.infer<typeof RoleSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;
export type PublicRecord = z.infer<typeof RecordSchema>;
export type RecordItem = PublicRecord["items"][number];
export type Competitors = z.infer<typeof CompetitorsSchema>;
export type Competitor = Competitors["field"][number];
export type Ideas = z.infer<typeof IdeasSchema>;
export type Idea = Ideas["items"][number];
export type Sources = z.infer<typeof SourcesSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type Fit = z.infer<typeof FitSchema>;
export type OrgNode = z.infer<typeof OrgNode>;

/** Authoring types: what a content file writes (defaults may be omitted). */
export type ConfigInput = z.input<typeof ConfigSchema>;
export type CompanyInput = z.input<typeof CompanySchema>;
export type RoleInput = z.input<typeof RoleSchema>;
export type WorkflowsInput = z.input<typeof WorkflowsSchema>;
export type RecordInput = z.input<typeof RecordSchema>;
export type CompetitorsInput = z.input<typeof CompetitorsSchema>;
export type IdeasInput = z.input<typeof IdeasSchema>;
export type SourcesInput = z.input<typeof SourcesSchema>;
export type FitInput = z.input<typeof FitSchema>;
