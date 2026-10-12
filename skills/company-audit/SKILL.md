---
name: company-audit
description: Build an outside-in audit site for a job interview — one company, read through one role — from the open-source company-audit template. Use when someone wants to research a company for an interview, "make an audit site", prep for an interview with a site they can share, says "/company-audit <job link>", or wants to resume or deploy an audit they've started. Creates the repo, researches the company with every claim sourced and labelled, writes encrypted interview prep, fact-checks it, and deploys it with no variables to set.
---

# company-audit

You're building an **outside-in audit**: a small website about one company,
read through one job, with the candidate's interview prep sealed behind a key
only they hold. The template, `byw1/company-audit`, holds the structure, the
rules and the research playbook. This skill gets you into a copy of it.

## 1. Get into an audit repo

- **Already in one** (`content/audit.config.ts` and `CLAUDE.md` exist): go to
  step 2.
- **Otherwise,** create one from the template, named for the company:

  ```bash
  gh repo create <owner>/<company>-audit --template byw1/company-audit --public --clone
  cd <company>-audit && npm install
  ```

  Can't run commands here (claude.ai, say)? Ask the person to click **Use this
  template** on github.com/byw1/company-audit, open the new repo in Claude
  Code, and paste `Build and ship: <job link>`. That's the whole job here.

## 2. Build it

Read the repo's `CLAUDE.md` and follow **Start here**. It works out the
company from the job link and the person from the message or their connected
career workspace, runs the research playbook
(`.claude/commands/new-audit.md`), fact-checks, proves nothing private leaks,
and ships. `npm run status` is the checklist throughout, and a new session
picks up from its "Next".

Ask once, up front, only for what you can't find yourself. That's usually who
the person is: name, email, LinkedIn, their rules, and where their record
lives. Never use resumes they've already sent as evidence.

## 3. Report back

What **Start here** lists, links first: the live site, and the prep link
(`<url>/?prep=<PREP_KEY>`). The prep link matters most: it's the only key to
their prep, and nothing else holds it. Then the summary and fact-check table.

Before the interview, `npm run jd -- <posting URL>` re-checks that the role is
still listed.

## Rules that never bend

- No inside information, no invented quotes, no fabricated metrics. Anything
  about how the company runs internally is an Outside-in read, unless a public
  source says it.
- Real numbers only, each with a source and a date. Never round up.
- Never commit `content/prep.ts` or `.env.local`, and never put `PREP_KEY`
  anywhere public: not a host variable, a CI secret, a commit or the site.
- Nothing about the person that they haven't given you evidence for. A gap is
  better than an invention.
