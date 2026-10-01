# company-audit

A template for **outside-in audit sites**: one company, read through one role,
built in an afternoon. Each audit shows how the business is set up, how the work
flows, what the company has said publicly, who it competes with, and what I'd do
first. It reads like an operator wrote it, and every claim says whether it's
sourced, my read, or an illustrative model.

Each site does two jobs:

1. **Proof for a hiring team.** It's a link I can send. It is **public by
   default**: anything a recipient sees, or finds by editing the URL, is the
   audit itself.
2. **My interview prep.** The talk track, likely questions, pushback, gaps,
   who's who and questions to ask sit behind a key, are rendered only on the
   server, and are never shipped to anyone else.

Everything company-specific lives in `content/`. A new audit edits only that
folder, so template improvements can be pulled into older audits without
conflicts.

The template ships with **Northwind Commerce, a fictional company**, so it never
carries a real company's prep notes.

---

## Spin up a new audit

```bash
gh repo create byw1/{company}-audit --template byw1/company-audit --private --clone
cd {company}-audit
npm install
git config merge.ours.driver true          # once per clone (see "Pulling template improvements")

# then, in Claude Code:
/new-audit {Company} {domain} {JD URL}

npm run logos && npm run dev               # http://localhost:3000, ?prep=dev unlocks prep locally
npm run verify:share                       # must pass before anything gets sent
```

`/new-audit` does the following, in order:

1. Confirms the role is live on the careers index, not just at its URL.
2. Researches the company, the public record and four to eight competitors.
3. Derives the workflows from the JD.
4. Writes ideas that each trace to something real.
5. Drafts the prep from my own record.
6. Runs a separate fact-check pass that rates every claim BLOCKER / FIX / NOTE.

It reports back with a table of everything it cut. The full playbook is in
`.claude/commands/new-audit.md`; the rules it follows are in `CLAUDE.md`.

**Every audit repo is private.** The prep gate protects the deployed site, not
the source: in a public repo, anyone can read `content/prep.ts` (gaps, pushback,
who's who) on GitHub. `npm run verify:share` warns when the remote is public.
Keep this template private too.

## Deploy on Railway

1. **New project → Deploy from GitHub repo**, and pick `byw1/{company}-audit`.
2. **Variables → `PREP_KEY`**: a long random string, e.g. from
   `openssl rand -base64 32`. Keep it in your password manager.
3. **Settings → Networking → Generate domain.** The link-preview image's
   absolute URL comes from `RAILWAY_PUBLIC_DOMAIN` (or `NEXT_PUBLIC_SITE_URL`
   for a custom domain), which a running deploy only sees if the domain
   existed when it started.
4. **Redeploy** once the domain exists, so the new deploy picks it up.
5. Open `https://<domain>/?prep=<PREP_KEY>` once. A cookie remembers you for 60
   days and the key is removed from the address bar.
6. Use the **Prep / Share** toggle in the header to preview exactly what a
   recipient sees, then send the plain URL.

The build and start commands are the defaults (`npm run build`,
`npm run start`); `start` binds to `$PORT`. There's no database and no runtime
fetch: everything renders from `content/`.

## What's on the site

| Route | What |
| --- | --- |
| `/` | The thesis in one scroll: what the company is and how it makes money, the numbers that matter, the three things I'd say in two minutes, then each chapter's strongest picture |
| `/company` | The org drawn around the role (reports to, peers, upstream, downstream), business model, revenue lines, timeline, funding, leadership |
| `/workflows` | The JD line by line, mapped to workflows; each workflow at `/workflows/{id}` as a flowchart with owners, leaks, KPIs and the first change I'd make |
| `/record` | Everything they've said publicly, as a ledger of what they said → what it implies for the role, plus hiring signals |
| `/competitors` | A positioning map with each competitor's direction of travel, and a sortable table that opens into dossiers |
| `/ideas` | Initiatives ranked by impact and effort, each traced to a leak, a stated plan or a competitor move, and the first 90 days |
| `/sources` | Every source, numbered, grouped and dated |
| `/fit` | Optional, off by default: JD requirement → my evidence |
| `/prep` | Key only, 404 otherwise: talk track, questions, pushback, gaps, who's who, questions for them |

Chapters can be switched off in `content/audit.config.ts`. A switched-off
chapter 404s.

- **⌘K** (or `/`) searches every chapter, workflow, stage, leak, competitor,
  record item, idea and source. Every item has a deep link.
- **Presenter mode**: `?present`, or press **P**. It hides the chrome,
  enlarges the type, and **← →** step through the chapters. **Esc** leaves.
- **Talk-track notes** (prep view only): press **N** for a drawer with the
  note for the chapter on screen. **Pop out** opens a window that follows along,
  for a second screen while the main one is shared. Presenter mode always
  closes the drawer.
- **Save as PDF** is in the footer. Print expands everything and forces the
  light theme.

## Every claim is labelled

| Label | Meaning |
| --- | --- |
| **Sourced** | Taken from a public source, with its link and the date it was read |
| **Outside-in read** | My inference from public evidence, not inside knowledge |
| **Illustrative model** | Invented numbers that show how a mechanism works |

Content is written with `sourced()`, `quote()`, `read()`, `model()` and
`stat()` from `lib/claims.ts`, and validated with Zod at build time. The build
fails on any of these:

- an unlabelled claim;
- a source id that doesn't exist;
- a figure in a plain-text field;
- a workflow that doesn't map to the JD;
- a leak at a stage that doesn't exist;
- an idea that doesn't trace to anything;
- a source dated in the future.

`npm run validate` prints every problem at once, with a "did you mean".

## Public vs. prep

The view is decided on the server (`middleware.ts` → `lib/view.ts`) and handed
down. Prep content is never hidden with CSS. It simply isn't rendered, so it
isn't in the HTML, the RSC payload or any JavaScript bundle.

- `?prep=<PREP_KEY>` sets the cookie. It stores a digest of the key, not the key.
- `?prep=off` clears it. A wrong key clears it too.
- `?share` previews the public view while you hold the key.
- Locally, with no key set, `?prep=dev` works.

Three layers keep prep private:

- **ESLint** stops public code importing prep. The only door is
  `<PrepLayer>`, which renders nothing in the share view.
- **`server-only`** fails the build if prep ever reaches a client bundle.
- **`npm run verify:share`** proves it on the built site (below).

## Checks

```bash
npm run validate      # content: schemas, labels, sources, cross-references
npm run check         # validate + typecheck + lint
npm run verify:share  # the share view leaks nothing
npm run lighthouse    # Lighthouse CI against a local production server
```

**`verify:share`** builds the site, starts it with a throwaway key, and derives
probes from every string in `content/prep.ts`. Then it:

- Crawls every route in the share view and checks:
  - the raw server HTML, after stripping React's `<!-- -->` text separators
    and decoding entities (otherwise `{x} fit` serializes as
    `x<!-- --> fit` and a naive search passes falsely);
  - the RSC payload a client-side navigation would fetch;
  - the rendered DOM in Chromium, with the ⌘K palette open;
  - the search index;
  - every JS and CSS chunk the build ships.
- Repeats the checks in the share preview.
- Asserts that `/prep` is 404 without the key, with a forged cookie and under
  `?share`.
- Runs a **control**: the same probes must appear in the prep view, so a pass
  can't come from probes that match nothing.
- Warns if the git remote is a public repo.

**CI** (`.github/workflows/ci.yml`) runs on every push:

- validate, typecheck, lint and build;
- `verify:share`;
- Lighthouse CI on `/`: the median of five mobile runs must score 95+ for
  performance and accessibility.

## Logos, favicon, accent

`npm run logos` caches an icon for every domain in `content/` (the company,
competitors, and each source's host) from [Twenty's favicon
service](https://github.com/twentyhq/favicon) into `public/logos/`.

- Anything that 404s, or sits on a reserved TLD like `.example`, becomes a
  monogram tile in the accent.
- If the company's own domain has no icon, set `company.iconDomain` in
  `audit.config.ts` to another of its domains that has one (an investor or
  regional site). The script says when this is needed.
- The output is committed: the build never fetches, and the site works with the
  network off.
- Re-run it whenever a new domain appears.

The **accent** is derived from the company's icon (`node-vibrant`).

- It is lifted to a minimum chroma, then darkened (light mode) or lightened
  (dark mode) until it clears contrast on every surface.
- Greyscale icons get a hue from a curated set, picked by domain.
- Override it with `accent` in `audit.config.ts`.

The **favicon** is the company's icon inside my frame: a dark rounded tile with
an accent dot. The tab is recognisable, but the site never looks like the
company's own property. The header always reads "An outside-in read of
{Company}, by William Lee". The **link preview** is generated per audit.

## Design

- **Tokens** live on `:root` in `app/globals.css`, with a warm-paper light mode
  and a warm-charcoal dark mode, both deliberate. Text tokens clear WCAG AA on
  every surface. Theme follows the OS, with a toggle in the header.
- **One accent**, used only for what moves money or needs attention.
- **Type:**
  - Instrument Serif for headlines (`u-display`);
  - Geist for prose (`u-prose`);
  - Geist Mono for labels and columns of numbers (`u-label`, `u-num`, tabular
    figures);
  - headline figures in the sans (`u-figure`).

  All load from npm via `next/font/local`, as latin subsets, never from
  `next/font/google`.
- **The hero is a slot**: `shader` (a domain-warped gradient), `particles`, or
  `flywheel` (3D, three.js), set in `audit.config.ts`.
  - It starts on the visitor's first interaction, over a matching static
    gradient, so text paints first and an unattended page costs nothing.
  - It pauses off-screen, and renders a single still frame for reduced motion,
    software rendering or slow devices.
- **shadcn/ui**: `components.json` is set up, and components install with
  `npx shadcn add …` and inherit the tokens. 21st.dev's registry is configured
  as `@21st`; it needs `TWENTY_FIRST_API_KEY` in `.env.local`. Restyle anything
  you pull in so nothing looks stock.

## Pulling template improvements into an older audit

Audit repos are created from the template, so their histories start unrelated.
The first time:

```bash
git config merge.ours.driver true
git remote add template https://github.com/byw1/company-audit.git
git fetch template
git merge template/main --allow-unrelated-histories --no-commit -X theirs
git checkout HEAD -- content public/logos      # keep this audit's content
npm install && npm run check && npm run verify:share
git commit -m "Pull template improvements"
```

After that, `git fetch template && git merge template/main` is enough:
`.gitattributes` keeps `content/**` and `public/logos/**` on the audit's side.
If the template changed the content schema, `npm run validate` says exactly what
to update.

## Deploy lessons (from the two hand-built audits)

- **Node 22 is pinned** in `.nvmrc` and `engines.node`. Railway's builder
  otherwise picks Node 18. Tailwind v4's native binding needs Node 20+, and the
  failure surfaces much later as `Cannot find native binding`.
- **Fonts come from npm**, so the build never depends on a network fetch.
- **Redeploy after setting the domain.** `metadataBase` is read when the
  server starts, so a deploy that started before the domain existed keeps
  pointing preview cards at localhost until it restarts.
- **`noindex`**, via metadata and an `X-Robots-Tag` header.
- **Rendered per request** (`force-dynamic`), because the view is decided per
  request. Pages carry `Cache-Control: private, no-store`, so no shared cache can
  hand the prep view to someone else.
