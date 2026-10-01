---
name: company-audit
description: Build an outside-in audit site for a job interview — one company, read through one role — from the open-source company-audit template. Use when someone wants to research a company for an interview, "make an audit site", prep for an interview with a site they can share, or says "/company-audit <Company> <domain> <JD URL>". Creates the repo, researches the company with every claim sourced and labelled, writes encrypted interview prep, fact-checks it, and deploys to Cloudflare Workers or Railway.
---

# company-audit

You're building an **outside-in audit**: a small website about one company,
read through one job. It shows how the business is set up, how the work in the
role flows, what the company has said publicly, who it competes with, and
what the candidate would do first. Every claim on it is labelled **Sourced**,
**Outside-in read** or **Illustrative model**. Behind a key, the same site holds
the candidate's interview prep, which is committed only in encrypted form, so
the repo can be public.

The template does the heavy lifting: schemas, validation, the prep gate, a leak
test, logos, deploy configs. Your job is research and writing, inside its
rules.

## What you need from the person

Ask for anything missing, in one message:

1. **The company and the role**: company name, its domain, and the URL of the
   job posting.
2. **Who they are**: name, email and LinkedIn URL, for the site's byline. No
   phone number.
3. **Their rules and evidence**: anything that must or must not be said about
   them, and where their record lives (a resume or "master context" file, a
   LinkedIn export, a connected career workspace). Never use resumes they've
   already sent as evidence.
4. **Where it should live**: a GitHub account or org for the new repo, and
   whether to deploy to Cloudflare Workers (default) or Railway.

## 1. Get a repo from the template

If the current directory isn't already a company-audit repo (look for
`content/audit.config.ts` and `scripts/verify-share.ts`):

```bash
gh repo create <owner>/<company>-audit --template byw1/company-audit --public --clone
cd <company>-audit
npm install
npm run prep:init        # content/prep.ts (gitignored) + PREP_KEY and PREP_SECRET in .env.local
```

Without the `gh` CLI, the person can press **Use this template** on
github.com/byw1/company-audit, then clone their new repo.

Public is fine: prep is only ever committed encrypted. `.env.local` (with
`PREP_SECRET`) and `content/prep.ts` are gitignored. Tell the person to save
`PREP_KEY` and `PREP_SECRET` in their password manager.

## 2. Write `content/author.md`

Fill it from step 3 of "What you need": their guardrails, where their evidence
lives, what never to use. Set `author` in `content/audit.config.ts`. This file
is public; keep private details out of it.

## 3. Run the research playbook

Read `CLAUDE.md` (the hard content rules), then follow
`.claude/commands/new-audit.md` step by step. In Claude Code that's
`/new-audit <Company> <domain> <JD URL>`. In short:

1. Confirm the role is live on the careers **index**, save the JD verbatim to
   `content/jd.md`.
2. The company, the role and its org, the public record, four to eight
   competitors with dated moves, the workflows the role owns, ideas that each
   trace to evidence, a 30/60/90 plan.
3. Prep in `content/prep.ts`, from the person's own evidence only. Then
   `npm run prep:seal`.
4. A separate fact-check pass: the `fact-checker` subagent
   (`.claude/agents/fact-checker.md`) rates every claim BLOCKER / FIX / NOTE.
   Fix every BLOCKER and FIX.

Run `npm run validate` after each file. It catches unlabelled figures, unknown
sources, JD quotes that aren't verbatim, and ideas that trace to nothing.

## 4. Prove it

```bash
npm run logos          # icons, accent, favicon and link-preview images (commit them)
npm run prep:seal
npm run check
npm run verify:share   # builds the site and proves nothing from the prep leaks
```

All must pass. Then `npm run dev`, open http://localhost:3000, and read every
page once as a recruiter would. `?prep=<PREP_KEY>` unlocks the prep view;
`?prep=off` locks it again.

## 5. Deploy

**Cloudflare Workers** (default). The free plan allows 10 ms of CPU per
request; if pages fail with error 1102, the site needs Workers Paid.

```bash
npx wrangler login
# rename "name" (and the self-reference service) in wrangler.jsonc to <company>-audit
npx wrangler secret put PREP_KEY      # paste from .env.local
npx wrangler secret put PREP_SECRET   # paste from .env.local
npm run cf:deploy
```

**Railway**: New project → Deploy from GitHub repo, add `PREP_KEY` and
`PREP_SECRET` as variables, generate a domain, redeploy.

For CI to check the real prep, add `PREP_SECRET` as a GitHub Actions secret.

## 6. Report back

1. The thesis in three lines, the numbers that matter, anything surprising.
2. The fact-check table: every claim cut or changed, and why.
3. Open gaps: what couldn't be sourced, evidence of theirs you couldn't find.
4. The live URL, and the one-time unlock link `https://<url>/?prep=<PREP_KEY>`
   (tell them not to share that one).

## Rules that never bend

- No inside information, no invented quotes, no fabricated metrics. Anything
  about how the company runs internally is an Outside-in read unless a public
  source says it.
- Real numbers only, each with a source and a date. Never round up.
- Never commit `content/prep.ts`, `.env.local` or `PREP_SECRET`.
- Nothing about the person that they haven't given you evidence for. A gap is
  better than an invention.
