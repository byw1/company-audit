# Contributing

Thanks for improving the template. Every audit built on it gets your change
through `npm run template:update`, so changes here should work for any company
and any author.

## Set up

```bash
npm ci
npm run dev          # http://localhost:3000; ?prep=dev shows the example's prep view
```

No secrets are needed to work on the template. It runs the fictional
Northwind example, and its prep (`content/prep.example.ts`) stands in for
sealed prep.

## Where changes go

- **The framework** (`app/`, `components/`, `lib/`, `scripts/`): anything an
  audit doesn't edit. Most changes go here.
- **The example** (`content/`): keep Northwind complete and coherent. It's
  the reference every new audit is written against, and the fixture the
  checks run on. Its source ids start `nw-`, and its domains end `.example`,
  so `npm run status` and `verify:share` can tell example from real.
- **The rules** (`CLAUDE.md`, `.claude/commands/`, `.claude/agents/`,
  `skills/company-audit/`): what Claude follows when it researches and
  writes. Change these when a real audit shows a rule was missing or wrong,
  and say which audit in the PR.

## Before you open a PR

```bash
npm run check          # validate, typecheck, lint, unit tests
npm run verify:share   # the share view leaks nothing from the prep
npm run cf:build       # still builds for Cloudflare Workers
```

CI runs all three, plus Lighthouse on `/` (95+ for performance and
accessibility).

- **New logic in `scripts/` or `lib/`:** add a test in `tests/`. Tests must
  pass inside any audit, not just on the example: build fixtures, or break
  the repo's own content one thing at a time (see `tests/validate.test.ts`).
- **Changing the content schema** (`lib/schema/`): existing audits will meet
  it on their next `template:update`. Make the validator's message say
  exactly what to change.

## The prep boundary

Never weaken it. Prep is rendered only on the server, and only for a request
the middleware has already decided is the prep view. It isn't hidden with
CSS. Public code imports prep only through `<PrepLayer>`. If a change touches
`middleware.ts`, `lib/view.ts`, `lib/prep/` or `components/prep/`, run
`npm run verify:share` and say in the PR what you checked.
