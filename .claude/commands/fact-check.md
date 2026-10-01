---
description: Run the fact-checker over content/ and fix what it finds
---

Run the `fact-checker` subagent over everything in `content/` (see
`.claude/agents/fact-checker.md`). When it reports back:

1. Fix every BLOCKER and every FIX in `content/`. Pull back anything that
   isn't supported, or relabel it as a `read()` if it's honestly an inference.
   Never "fix" a claim by finding a weaker source that happens to agree.
2. Run `npm run validate` and `npm run verify:share`.
3. Report a table of every claim cut or changed: rating, original wording, new
   wording or "cut", and why. List the NOTEs separately, unchanged.
