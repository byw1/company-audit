---
description: Run the fact-checker over content/ and fix what it finds
---

Run the `fact-checker` subagent over everything in `content/` (see
`.claude/agents/fact-checker.md`). When it reports back:

1. Fix every BLOCKER and every FIX in `content/`. Pull back anything that
   isn't supported, or relabel it as a `read()` if it's honestly an inference.
   Never "fix" a claim by finding a weaker source that happens to agree.
2. Run `npm run validate`, `npm run prep:seal` and `npm run verify:share`.
3. Write `content/factcheck.md`: the date, totals by rating, and a table of
   every public claim cut or changed (rating, original wording, new wording or
   "cut", why), then the NOTEs left as they are. **Leave out every finding about
   `prep.ts`**: this file is committed and the repo may be public. Prep
   findings go in your reply only. `npm run status` reads this file to know
   the pass has run.
4. Report the same table in your reply, with the prep findings added.
