import type { ConfigInput } from "@/lib/schema/public";

/**
 * One audit, one company, one role. Everything company-specific lives in
 * content/; components never change between audits.
 *
 * THIS IS THE TEMPLATE'S EXAMPLE: Northwind Commerce is fictional. Every
 * number, person, quote and source below is invented to show the format.
 * /new-audit replaces all of it.
 */
export default {
  company: {
    name: "Northwind Commerce",
    domain: "northwind.example",
    fictional: true,
    ticker: "NWND",
  },
  role: {
    title: "Head of Marketplace Operations",
    team: "Marketplace Operations",
    location: "Portland, OR or remote (US)",
    jdUrl: "https://careers.northwind.example/jobs/head-of-marketplace-operations",
    jdSource: "nw-jd",
  },
  author: {
    name: "William Lee",
    email: "william@bywilliaml.com",
    linkedin: "https://www.linkedin.com/in/bywilliaml",
  },
  researched: "2026-09",
  // accent: "#2f5bea", // optional: overrides the colour derived from the company's icon
  hero: {
    variant: "shader",
    orbits: ["Makers", "Retailers", "Fulfilment"],
  },
  modules: {
    company: true,
    workflows: true,
    record: true,
    competitors: true,
    ideas: true,
    sources: true,
    fit: false,
  },
} satisfies ConfigInput;
