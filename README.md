# company-audit

A GitHub template for outside-in company audit sites: one company, one role,
public by default, with a key-gated prep layer for interviews.

Everything company-specific lives in `content/`; components never change
between audits. The template ships with a **fictional** example company,
Northwind Commerce, so it never carries a real company's prep notes.

```bash
npm install
npm run validate   # schemas, sources, cross-references
npm run dev        # http://localhost:3000  (?prep=dev unlocks the prep view locally)
```

The full setup and deploy guide is being written; see CLAUDE.md for the rules
content follows.
