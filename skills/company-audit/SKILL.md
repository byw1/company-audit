---
name: company-audit
description: Build an outside-in audit site for a job interview — one company, read through one role — from the open-source company-audit template. Use when someone wants to research a company for an interview, "make an audit site", prep for an interview with a site they can share, says "/company-audit <Company> <domain> <JD URL>", or wants to resume or deploy an audit they've started. Creates the repo, researches the company with every claim sourced and labelled, writes encrypted interview prep, fact-checks it, and deploys to Cloudflare Workers.
---

# company-audit

You're building an **outside-in audit**: a small website about one company,
read through one job. It shows how the business is set up, how the work in the
role flows, what the company has said publicly, who it competes with, and what
the candidate would do first. Every claim is labelled **Sourced**,
**Outside-in read** or **Illustrative model**. Behind a key, the same site
holds the candidate's interview prep, committed only encrypted, so the repo
can be public.

The template does the structure; you do the research and writing. It gives you
three commands that drive everything:

- `npm run new`: start an audit from a posting URL. It fetches the job,
  writes the config, loads the author's profile and makes the secrets.
- `npm run status`: the checklist, from setup to deploy, and **the one thing
  to do next**. Run it whenever you're unsure, and after every step. It works
  out progress from the files, so a new session can pick up mid-audit.
- `npm run deploy:cf`: build, deploy to Cloudflare, and set the secrets.

## 0. Resuming?

If the current directory is already an audit (`content/audit.config.ts` and
`scripts/status.ts` exist), run `npm run status` and continue from its "Next".
Skip to step 3.

## 1. What you need

Ask in one message for anything you don't have:

1. **The company and the job**: company name, its domain, and the posting URL.
2. **The person**, only if `~/.config/company-audit/author.json` doesn't exist
   yet:
   - name, email and LinkedIn URL, for the byline (never a phone number);
   - their rules: what must or mustn't be said about them;
   - where their record lives: a resume or notes file, a LinkedIn export, a
     connected career workspace.

   Never use resumes they've already sent as evidence.
3. **Where the repo goes**: a GitHub account or org.

## 2. Create and start the audit

```bash
gh repo create <owner>/<company>-audit --template byw1/company-audit --public --clone
cd <company>-audit && npm install
npm run new -- --company "<Company>" --domain <domain> --jd <posting URL>
```

`new` stops and says so if the role isn't on the company's careers index.
Check with the person before going on.

**First audit for this person?** Write their rules and evidence sources into
`content/author.md`, and their byline into `content/audit.config.ts` →
`author`. Then run `npm run author:save`. Every future audit starts with
them.

Public is fine. `content/prep.ts` (the plain notes) and `.env.local` (the
secrets) are gitignored, and `npm run verify:share` fails if prep is ever
committed in plain text. Tell the person to save `PREP_KEY` and `PREP_SECRET`
from `.env.local` in their password manager: without `PREP_SECRET` the sealed
prep can't be opened.

## 3. Research, in the order `status` gives

Read `CLAUDE.md` first: it holds the hard content rules. Then follow
`.claude/commands/new-audit.md` (in Claude Code, `/new-audit`) for each step
`npm run status` points at:

1. company and role;
2. the public record;
3. competitors: four to eight, each with dated moves from the last twelve
   months;
4. the workflows the role owns;
5. ideas that trace to evidence, and a 30/60/90 plan;
6. prep in `content/prep.ts`, from the person's own evidence, then
   `npm run prep:seal`;
7. `/fact-check`: a separate fact-checker rates every claim BLOCKER, FIX or
   NOTE. Fix every BLOCKER and FIX; it records the result in
   `content/factcheck.md`.

After each file, run `npm run validate`. It catches unlabelled figures,
unknown sources, JD quotes that aren't verbatim, and ideas that trace to
nothing. Each research file is done when `status` stops finding the template's
fictional example in it.

## 4. Prove it

```bash
npm run logos          # icons, accent, favicon and link-preview images (commit them)
npm run verify:share   # builds the site and proves nothing from the prep leaks
npm run status         # everything above "Deployed" should be ✓
```

Then `npm run dev` and read every page once as a recruiter would.
`?prep=<PREP_KEY>` unlocks the prep view; `?prep=off` locks it again.

## 5. Deploy

```bash
npx wrangler login                 # once per machine (or CLOUDFLARE_API_TOKEN)
npm run deploy:cf -- --github      # deploy, set the Worker's secrets, and PREP_SECRET for CI
git add -A && git commit -m "<Company> audit" && git push
```

On the free plan Workers allow 10 ms of CPU per request. If pages fail with
error 1102, the person needs Workers Paid. Railway also works (README →
Deploy).

## 6. Report back

1. The thesis in three lines, the numbers that matter, anything surprising.
2. The fact-check table: every claim cut or changed, and why.
3. Open gaps: what couldn't be sourced, and evidence of theirs you couldn't
   find.
4. The live URL, and how to unlock it once: `https://<url>/?prep=<PREP_KEY>`.
   That link isn't for sharing.

Before the interview, `npm run jd -- <posting URL>` re-checks that the role is
still listed.

## Rules that never bend

- No inside information, no invented quotes, no fabricated metrics. Anything
  about how the company runs internally is an Outside-in read, unless a public
  source says it.
- Real numbers only, each with a source and a date. Never round up.
- Never commit `content/prep.ts`, `.env.local` or `PREP_SECRET`.
- Nothing about the person that they haven't given you evidence for. A gap is
  better than an invention.
