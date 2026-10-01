# The author

Who wrote this audit, and the rules for anything written about them. Your
name, email and LinkedIn go in `content/audit.config.ts` (`author`); the site
shows them in the header and footer.

Claude reads this file before writing `content/prep.ts` or `content/fit.ts`.
Its rules override the defaults in `CLAUDE.md`. This repo may be public, so
write rules here, not private details: those belong in your sealed prep.

## Guardrails

Hard rules. Edit and add your own.

- Real numbers only. Never inflate or round up a figure.
- No phone number anywhere. Email and LinkedIn only.
- If the evidence for something isn't there, list it in prep as a gap. Don't
  invent it.
- <!-- How you want your role and scope described, e.g. "Lead with
  leadership scope; tools I built come second." -->
- <!-- Words to avoid about yourself, e.g. "Never call me an engineer." -->
- <!-- What stays off: side projects, past employers, anything sensitive. -->

## Where my evidence lives

Claude searches these, two or three ways, before deciding there's no evidence
for something.

- <!-- e.g. "My master context file: path in MASTER_CONTEXT_PATH in .env.local
  (never committed)." -->
- <!-- e.g. "My LinkedIn export in ~/Documents/linkedin/." -->
- <!-- Optional: a career workspace connected to Claude, such as Hired
  (hired.tools): "search it with search_me; read every GUARDRAIL note first." -->

## Never use

- Resumes or applications already sent. They're records of what was sent,
  and some claims in them may have since been corrected.
