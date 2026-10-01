# company-audit

A template for outside-in audit sites: one company, read through one role.
Each audit is its own repo created from this template, and can be public: the
site is public by default, and the key-gated prep layer (interview notes) is
committed only in encrypted form.

Two jobs, in this order:

1. **Proof for a hiring team.** It reads like an operator wrote it, not a fan:
   how the business is set up, how the work flows, what the company has said
   publicly, who it competes with, and what I'd do first.
2. **The author's interview prep.** Talk track, likely questions, pushback,
   gaps, who's who and questions to ask, never visible to anyone without the
   key, and never in the repo in plain text.

The site is about **the company**, not about the author. `/fit` is optional
and off by default. "I" and "me" below mean the author: the person whose name
is in `content/audit.config.ts` and whose rules are in `content/author.md`.

## Where things live

| Path | What |
| --- | --- |
| `content/` | **Everything company-specific.** A new audit edits only this folder (plus `content/generated/` and `public/logos/`, which scripts write). |
| `content/audit.config.ts` | Company, domain, role, JD source, research month, accent override, hero variant, modules on/off |
| `content/company.ts` | One-liner, model, 2–4 stats, the two-minute thesis, overview, timeline, funding, leadership, business model, revenue lines |
| `content/role.ts` | JD responsibilities and requirements (quoted, sourced to the posting), where the role sits in the org |
| `content/workflows.ts` | Workflows the role owns: stages, owners, leaks, KPIs, first move; each mapped to JD lines |
| `content/public-record.ts` | What they said → what it implies; hiring signals |
| `content/competitors.ts` | Axes, the company's own position, 4–8 competitors with moves, direction, threat, response |
| `content/ideas.ts` | Initiatives (impact, effort, traces) and the 30/60/90 plan |
| `content/sources.ts` | Every source: id, title, publisher, URL, kind, published, **accessed**, group; plus caveats |
| `content/author.md` | **The author's rules**: guardrails for anything written about them, and where their evidence lives. Read before writing `prep.ts` or `fit.ts`. |
| `content/prep.ts` | **PRIVATE, gitignored.** Talk track, likely questions, pushback, gaps, who's who, questions for them. Never committed. |
| `content/prep.sealed.json` | `prep.ts`, encrypted (AES-256-GCM) by `npm run prep:seal`. The only form of prep that's committed or deployed. |
| `content/prep.example.ts` | The shape of `prep.ts`, with a fictional example. `npm run prep:init` copies it to start. |
| `content/fit.ts` | Optional: JD requirement → my evidence |
| `content/jd.md` | The job description text, saved when the role was confirmed live |
| `lib/schema/` | Zod schemas and cross-file checks. `prep.ts` is separate and private. |
| `app/`, `components/`, `lib/` | The framework. Don't edit these for an audit; improve the template instead. |

## Commands

```bash
npm run prep:init     # once: content/prep.ts from the example, PREP_KEY + PREP_SECRET in .env.local
npm run validate      # schemas, labels, source ids, cross-references, dates, JD quotes
npm run logos         # icons into public/logos, the accent, and the favicon/link-preview PNGs (commit the output)
npm run dev           # http://localhost:3000 — seals prep first; ?prep=<PREP_KEY> unlocks the prep view
npm run prep:seal     # encrypt content/prep.ts → content/prep.sealed.json (prep:watch re-seals on save)
npm run check         # validate + typecheck + lint
npm run verify:share  # build, crawl the share view, prove nothing from the prep leaks
npm run cf:deploy     # build for Cloudflare Workers and deploy (README → Deploy)
```

`/new-audit <Company> <domain> <JD URL>` runs the research playbook below and
fills `content/`.

## Content rules (hard)

- **Every claim carries a label.** Write facts with the helpers in
  `lib/claims.ts`:
  - `sourced(text, sourceIds)`: taken from a public source.
  - `quote(text, sourceIds, { speaker })`: their exact words, checked
    against the source.
  - `read(text, { sources? })`: my inference, an **Outside-in read**.
  - `model(text)`: an **Illustrative model**, with invented numbers that show a
    mechanism. Use invented names, and say so in a `note`.
  - `stat(value, fact)`: a headline figure with its fact.

  Plain-text fields (titles, labels, owners) reject figures, so a number can
  never appear without a label. The build fails on an unlabelled claim.
- **One `sourced()` says only what its source says.** The most common
  fact-check failure is a sourced fact with one sentence of interpretation
  added in the same call. Put the interpretation in its own `read()`. The
  same goes for a headline or title: "growth broke planning" is a claim about
  how the company runs inside; "growth is outpacing planning" is a read.
- **Quotes from the JD are checked mechanically.** `npm run validate` fails
  any `quote()` sourced to the posting that isn't word for word in
  `content/jd.md`.
- **Real numbers only, each with a source and a date.** Never round up. Where
  sources disagree, add a caveat in `sources.ts` rather than picking one
  silently.
- **No inside information, no invented quotes, no fabricated metrics.**
  Anything about how the company runs internally (who owns a stage, how a team
  is structured) is a `read()`, unless a public source says so.
- **Every source is dated.** `accessed` is the day it was read. "Researched
  {Month YYYY}" (from `audit.config.ts`) is stamped on every page.
- **Every idea traces** to a workflow leak (`leak:<workflow>/<leak>`), a stated
  plan (`record:<id>`) or a competitor move (`competitor:<id>`). Every
  workflow maps to at least one JD responsibility.
- **Competitor direction of travel rests on their own public moves in the last
  twelve months.** The validator warns on older moves.
- **The JD is quoted, not paraphrased**, in `role.ts`, and sourced to the
  posting.
- Write plainly. Short sentences, no hype, no "leverage/synergy/world-class".
  It should read like an operator's notes.

## Anything about the author (`prep.ts`, `fit.ts`)

**Read `content/author.md` first, every time.** It holds the author's
guardrails and says where their evidence lives. Its rules override anything
here. The ones that always apply:

- Real numbers only. Never inflate a figure.
- No phone number on the site. Email and LinkedIn only.
- Evidence comes from the sources `author.md` names, searched two or three
  ways before concluding something isn't there. **Never from resumes already
  sent**: they're records of what was sent, and some claims in them may have
  since been corrected.
- If the evidence for something isn't there, say so in `prep.ts` as a gap.
  Don't invent it.
- Don't copy personal details from the author's private notes into the repo
  beyond what the site needs. The repo may be public; only `prep.ts` is
  sealed.

## The prep boundary

Prep must never reach anyone without the key, and audit repos can be public.
Four layers enforce it, so one mistake can't leak:

1. **Sealed in git.** `content/prep.ts` is gitignored. `npm run prep:seal`
   encrypts it into `content/prep.sealed.json` with `PREP_SECRET` (32 random
   bytes from `npm run prep:init`, kept in `.env.local` and the host's
   secrets). The server decrypts it per request, only for the prep view.
   Never commit `prep.ts`, never commit `.env.local`, and never put
   `PREP_SECRET` anywhere public.
2. **ESLint** (`eslint.config.mjs`). Public code may not import
   `content/prep*`, `lib/prep/*`, `lib/schema/prep` or `components/prep/*`.
   The one sanctioned door is `<PrepLayer>` (`components/prep/PrepLayer.tsx`),
   a server component that renders nothing unless the server decided this
   request is the prep view.
3. **`server-only`** in `lib/prep/content.ts`. The build fails if prep is
   ever pulled into a client bundle.
4. **`npm run verify:share`** crawls the built site in the share view and
   checks the server HTML, RSC payloads, rendered DOM, search index and every
   JS chunk. A control step proves the same probes appear in the prep view.
   It also fails if `content/prep.ts` is tracked by git.

The view is decided in `middleware.ts` → `lib/view.ts`, never on the client.
Never hide prep content with CSS, never pass it as a client prop outside
`components/prep/`, and never add prep items to the public search index
(`/search-index`). The prep view's extra items come from `/prep/search-index`.

After editing `prep.ts`, run `npm run prep:seal` (or keep `npm run
prep:watch` running) and commit the sealed file. `npm run prep:status` says
whether it's current.

## Logos

`npm run logos` collects every domain in `content/` (the company, each
competitor, every source's host) and caches its icon from Twenty's favicon
service into `public/logos/`. It falls back to a monogram on a 404 or a
reserved TLD. It also derives the accent from the company icon, with contrast
checked for light and dark, and draws the favicon, home-screen icon and
link preview into `app/*.png`. If the company's own domain has no icon, set
`company.iconDomain` to another of its domains that does (an investor or
regional site). The output is committed: the build never fetches, nothing is
drawn at runtime, and the site works offline. Rerun it whenever you add a
competitor or a source on a new domain, or change the company, role or
author.

## Before anything is sent

1. `npm run check` passes, with no unresolved validation warnings you can't
   explain.
2. The fact-check pass has run (the `fact-checker` subagent), and every BLOCKER
   and FIX is resolved.
3. `npm run prep:status` says the sealed prep is current, and
   `npm run verify:share` passes.
4. Open the deployed site in the share view (header toggle, or a private
   window) and read it once as the recipient would.

## Research playbook

See `.claude/commands/new-audit.md`. It covers confirming the role is live, the
company, the public record, competitors, workflows, ideas, prep, and a separate
fact-check pass.
