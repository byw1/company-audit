# The first two audits on the template

Two runs proved the template end to end, in October 2026:

1. **SuperOrdinary** (GM, TikTok Shop Operations): a port of the hand-built
   `superordinary-audit` into a fresh instance.
2. **Mercor** (Head of Operations Planning): a company the template had never
   seen, run through `/new-audit` from the role in the Hired pipeline.

Both pass `npm run check` and `npm run verify:share`, and both went through
the fact-check pass with every BLOCKER and FIX resolved. Since then the
template seals prep, so audit repos can be public.

## What the template couldn't express (SuperOrdinary port)

| In the hand-built site | What happened in the port | Template change? |
| --- | --- | --- |
| Interactive Numbers chapter: creator funnel sliders, breakeven ROAS, an account P&L | Dropped. The template has `model()` text but no interactive models. The mechanisms survive as KPIs and first moves. | Open. An optional `models` slot (inputs, formula, output) would bring it back. |
| A dated BFCM countdown (T−8 weeks to T+2) | Became a workflow, "Run Black Friday and Cyber Monday", with the timing in each stage's detail. The live countdown is gone. | No. A workflow is the right home. |
| The Fanfix section: four "bridges" between the creator platform and commerce | One bridge became an idea (test Fanfix creators as affiliates). The other three were dropped. | No. Ideas need a trace, which keeps speculation in check. |
| Platform shifts (GMV Max, the fee change, the Shop tab, the U.S. deal) | Record items with a Platform theme. Works well. | No. |
| The public "questions I'd bring" section | Moved to prep, as the template intends. | No, by design. |
| A competitor group, "Performance-only shops" | Dropped. A competitor needs a domain and dated moves. | No. A group isn't a competitor. |
| Sources without access dates | Re-read on 2026-10-01 where reachable. Four that couldn't be reached keep the original's last research date, marked medium confidence. | No. The rule worked. |
| The company icon (superordinary.com has none) | `company.iconDomain` now points to the investor site, and `accent` keeps the original red-orange. | **Added `company.iconDomain`.** |

## What the fact-check caught

The hand-built SuperOrdinary site had shipped claims its own sources don't
support. The port surfaced them:

- "Plans to list on the NYSE" was cited to a press release that says "a
  national exchange". The NYSE line is on the investor site, which is now
  cited and checked.
- A 2021 growth-equity round "with the Puig family" was not in the cited
  article.
- Derek Trau was called co-founder; the investor site lists him as COO.
- "Offshore" VAs, "first U.S. TikTok Shop Summit", and "above $800M" were
  each more than the source says.
- Two competitors (Media Labs, Stella Rising) had no dated public move in
  twelve months, so both came off the map.

On Mercor, the fact-check found no BLOCKERs and 14 FIXes. Most followed the
same pattern: a sourced fact with one sentence of interpretation added inside
the same `sourced()`. It also caught the breach being used as evidence for
delivery reliability, which it isn't.

## Template changes from these runs

- `company.iconDomain`, for companies whose main domain has no icon.
- `npm run validate` fails any JD quote that isn't word for word in
  `content/jd.md`.
- The workflow page says stage owners are an outside-in read.
- The fit placeholder ships with no rows, so a new audit starts with no
  warnings.
- `verify:share` no longer prints a git error when there's no remote.
- The header is more opaque when scrolled, so text doesn't show through.
- `CLAUDE.md` and `/new-audit`:
  - one `sourced()` says only what its source says;
  - reading client-rendered company sites from their JavaScript bundle;
  - cutting competitors with no dated move;
  - `iconDomain`.

## Still open

- Interactive models (above).
- SuperOrdinary has two competitors on the map; the playbook asks for four to
  eight. More research is needed for agencies with dated moves.
- Mercor's leadership block rests on Wikipedia; a primary or press source
  would be better.
