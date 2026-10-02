---
description: Research a company and fill content/ for a new outside-in audit
argument-hint: <Company> <domain> <JD URL>
---

# New audit: $ARGUMENTS

You're building an outside-in audit of one company, read through one role, in
this repo (created from the company-audit template). Arguments: company name,
company domain, and the URL of the job description. If any is missing, ask
for it before starting.

Read `CLAUDE.md` first. Its content rules are hard rules. Everything you write
goes in `content/`; don't touch `app/`, `components/` or `lib/`.

Work through the steps in order and keep a checklist. Each step ends with a
file written and `npm run validate` passing. The template's Northwind
Commerce example shows the shape of every file: replace it completely,
leaving no fictional company, people or sources behind.

`npm run status` is the checklist for all of this: run it before you start
and after every step, and do what its "Next" says. It works out progress from
the files, so you can stop and resume at any point.

## 0. Set up

- If `content/audit.config.ts` is still the fictional example, run:
  `npm run new -- --company "<Company>" --domain <domain> --jd <JD URL>`.
  It fetches the posting, checks the careers index, saves `content/jd.md` and
  the `jd` source, writes the config, loads my author profile, names the
  Worker and creates the prep secrets. If it says the role isn't on the
  careers index, stop and tell me.
- Read `content/author.md`. If it still has the template's placeholder
  comments, ask me for my rules and where my evidence lives, and fill it in.
  Set `author` (name, email, LinkedIn) in `content/audit.config.ts` too, then
  `npm run author:save` so the next audit starts with them.
- In `content/audit.config.ts`:
  - check what `new` filled in (team, location), and set `researched` to this
    month if the research runs over;
  - choose a `hero.variant` (`shader`, `particles` or `flywheel`; give the
    flywheel three orbit names that mean something for this business);
  - if `npm run logos` says the company's domain has no icon, set
    `company.iconDomain` to one of its domains that has one (an investor or
    regional site), or `accent` if the icon is greyscale;
  - turn modules on or off. Fit stays off unless I ask for it.
- If `author.md` names a career workspace connected to you (for example
  Hired: `list_applications`, `get_company`, `list_notes`), check what it
  already knows about this company and role, and read every guardrail note.
  Build on that rather than starting cold.

## 1. Confirm the role is live, and save the JD

`npm run new` does this for Ashby, Greenhouse and Lever boards. For any other
board (or to re-check later, `npm run jd -- <URL> --save`):

- Find the role on the company's **careers index** (the list page, or their ATS
  board), not just at the direct URL. Postings often stay reachable by URL after
  they've been taken down. Many boards (Ashby, Greenhouse, Lever) have a
  public JSON API that lists every open role; use it when the page is
  client-rendered.
- If it's not on the index, stop and tell me. Don't build an audit for a dead
  role.
- Save the full JD text to `content/jd.md` with a header: URL, the index URL
  where you saw it, and the date checked.
- Add it to `sources.ts` as id `jd`, kind `job-posting`, with `accessed` set to
  today and a `note` saying it was confirmed on the index.

## 2. The company → `company.ts`, `role.ts`

Company sites built as client-side apps return an empty shell to a plain
fetch. Their text is usually readable in the site's own JavaScript bundle
(`curl` the page, then the `/assets/*.js` it loads, and search it). Say so in
the source's `note`.

Sources, in order of trust: their own filings and investor materials, official
site (about, team, newsroom), press releases, reputable press, funding
announcements, then LinkedIn-visible signals for the role's team (titles, team
size, who the role reports to).

- `oneLiner` and `model`: what they are and how they make money, one sentence
  each, sourced.
- `stats`: the two to four numbers that matter for this role, each sourced and
  dated, exact (never rounded up).
- `timeline`, `funding`, `leadership`, `businessModel`, `revenueLines`. Only
  give a revenue line a `share` if the share is public.
- `role.ts`:
  - quote each responsibility and requirement **verbatim** from the JD
    (`quote(..., "jd")`);
  - write `summary` as a `read()`;
  - fill `placement` (reports to, peers, reports, upstream, downstream). A node
    is `sourced` only if a source says so; otherwise it's a `read()`.
- `thesis`: the three things I'd say if I had two minutes. Write these last,
  once you know the business. They are reads that cite the sources they rest
  on.

## 3. The public record → `public-record.ts`

- If public: 10-K / S-1 / annual report, shareholder letters, earnings call
  transcripts. If private: founder letters, funding announcements, investor
  blog posts.
- Exec interviews and podcasts from the last 18 months. Recent press.
- Their open roles, read as signals of where they're investing (what's being
  hired, how many, which team, when). Each goes in `hiring` with the careers
  page as its source.
- Each item: `said` (a verbatim `quote()` or a sourced paraphrase) → `implies`
  (a `read()` about what it means for **this role**). Quotes must be word for
  word. If you can't find the exact words, paraphrase with `sourced()`.

## 4. Competitors → `competitors.ts`

- Four to eight **real** competitors, the ones this company actually loses deals
  or talent or supply to. Not a market map.
- Pick two axes that matter for this business and this role. `self` places the
  company on the same axes.
- For each competitor:
  - `moves`: dated public moves from the **last twelve months**. These are the
    evidence for `heading`.
  - `now` and `heading` (0–100 on each axis): your placement. The map labels
    it an outside-in read.
  - `direction`, `threatRead`, `response`. `response` is what this company
    should do about it.
- A competitor with no dated public move in the last twelve months comes off
  the map, however relevant. Say so in a `sources.ts` caveat rather than
  inventing a heading.
- Agency and startup sites make standing claims ("$500M+ managed"). A claim on
  a page isn't a dated move; a launch, a round or an acquisition is.
- `openings`: where the field leaves room.

## 5. Workflows → `workflows.ts`

- Derive them from the JD's responsibilities plus how this kind of business
  works publicly. Every workflow maps to at least one responsibility id
  (`jd: [...]`), and every responsibility should map to a workflow.
- Four to seven workflows, two to nine stages each. For each:
  - stages with an owner;
  - `leaks` (where value escapes), with a severity;
  - `kpis` (what you'd watch);
  - `firstMove` (the first change you'd make).
- How *they* run it internally is an outside-in read unless a public source says
  otherwise. Mechanics that are public (how a marketplace, a platform or a
  regulation works) can be sourced.
- Use `model()` with invented numbers only to show a mechanism. Say so in its
  `note`.

## 6. Ideas → `ideas.ts`

- Five to eight initiatives. Each one `traces` to a workflow leak
  (`leak:<workflow>/<leak>`), a stated plan (`record:<id>`) or a competitor move
  (`competitor:<id>`). The validator fails anything that doesn't resolve.
- Impact and effort, 1–5, are your estimates. Give each a `measure`.
- The 30/60/90 plan: learn, fix the biggest leak, then grow. Each window names
  the ideas it ships.

## 7. Prep → `content/prep.ts` (private)

Follow the guardrails in `content/author.md` to the letter.

- Find my evidence in the sources `author.md` names. Search the JD's own
  language two or three ways before deciding I have no evidence. Never use
  resumes already submitted.
- `talkTrack`: what I say on each chapter while sharing the screen, with the
  question I stop and ask.
- `likelyQuestions`: what they're likely to ask given this JD. Outlines, not
  scripts, each ending on a real story from my record.
- `pushback`: the objections to expect (experience, tenure, scope) and how I
  answer.
- `gaps`: honest distance against each requirement, and how I handle it.
- `whosWho`: the people I'm likely to meet (from LinkedIn, the team page, press),
  with what they've said publicly.
- `questionsForThem`: questions that show I read the record. Cite the source.
- `careful`, `numbers` (to know cold), `checklist` (before the call).
- Then `npm run prep:seal`. Only `content/prep.sealed.json` is committed.

## 8. Fact-check (separate subagent)

Run the `fact-checker` subagent (`.claude/agents/fact-checker.md`) on the
whole of `content/`. It fetches every source and quotes the passage that
supports each sourced claim, rating each one:

- **BLOCKER**: not supported, contradicted, invented, a quote that isn't
  verbatim, inside information, or a guardrail broken.
- **FIX**: the source supports something narrower. A number is rounded or
  stale, a date is wrong, the label is wrong (a read written as sourced), or a
  move is more than twelve months old.
- **NOTE**: it's supported, but could be tighter or better sourced.

Then fix every BLOCKER and FIX. Pull back anything unsupported, or relabel it
as a `read()` if it's honestly an inference.

## Finish

```bash
npm run logos          # icons, the accent, and the favicon/link-preview images; commit the output
npm run prep:seal      # encrypt content/prep.ts; commit content/prep.sealed.json
npm run check
npm run verify:share   # must pass
npm run status         # everything above "Deployed" is ✓
npm run dev            # read every page once, in the share view
```

Then report back with:

1. A short summary: the thesis in three lines, the numbers that matter, and
   anything surprising.
2. **The fact-check table**: every claim cut or changed, with its rating, the
   original wording, what changed, and why.
3. Open gaps: things you couldn't source, evidence of mine you couldn't find,
   and validation warnings left.
4. Next: `npm run deploy:cf -- --github` (after `npx wrangler login`). It
   deploys to Cloudflare and sets the secrets. Railway is in README → Deploy.
