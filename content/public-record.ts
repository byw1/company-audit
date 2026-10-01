import { quote, read, sourced } from "@/lib/claims";
import type { RecordInput } from "@/lib/schema/public";

/**
 * What the company has said publicly about where it's going, and what each
 * statement implies for this role. Quotes are verbatim and checked against
 * the source; everything in `implies` is my read. FICTIONAL EXAMPLE.
 */
export default {
  items: [
    {
      id: "q2-first-order",
      date: "2026-08-06",
      kind: "letter",
      title: "A dated goal for time to first order",
      theme: "Supply",
      said: quote(
        "By the end of 2027 we will halve the time it takes an approved maker to receive their first wholesale order.",
        "nw-q2-letter",
        { speaker: "Maya Okafor, CEO" },
      ),
      implies: read("Onboarding speed is the role's first public scoreboard. Verification is the step to attack, because it's the longest and the most operational."),
    },
    {
      id: "q2-credit",
      date: "2026-08-06",
      kind: "earnings-call",
      title: "Credit losses come up on the call",
      theme: "Terms",
      said: quote(
        "Credit losses were 2.1% of terms GMV in the quarter. We expect that to come down as we tighten limits for our newest retailers.",
        "nw-q2-call",
        { speaker: "Priya Raman, CFO" },
      ),
      implies: read("'Tightening limits' is an operations change as much as a finance one. Whoever owns limits and collections day to day owns this number."),
    },
    {
      id: "investor-day-services",
      date: "2025-11-18",
      kind: "talk",
      title: "Services carry the take-rate target",
      theme: "Fulfilment",
      said: sourced(
        "At Investor Day, management set an 18–19% medium-term take rate, with most of the expansion coming from fulfilment and payments.",
        "nw-investor-day",
      ),
      implies: read("Fulfilment has to grow and be good at the same time. Defect rates in Northwind's own warehouses become a revenue question, not just a service one."),
    },
    {
      id: "10k-damage",
      date: "2026-03-04",
      kind: "filing",
      title: "Damage named as a risk factor",
      theme: "Fulfilment",
      said: sourced(
        "The 10-K lists damage in transit as the leading return reason and names fulfilment quality as a risk to retailer retention.",
        "nw-10k-2025",
      ),
      implies: read("A packaging standard and root-cause tagging on claims are low-cost moves with a line straight to a disclosed risk."),
    },
    {
      id: "podcast-makers-first",
      date: "2026-05-21",
      kind: "podcast",
      title: "Makers first, even on policy",
      theme: "Policy",
      said: quote(
        "Every policy we write, we ask whether a two-person studio could live with it. If they can't, it's the wrong policy.",
        "nw-ceo-podcast",
        { speaker: "Maya Okafor, CEO" },
      ),
      implies: read("Enforcement has to be graduated and explained. A crackdown on late shipping that a small studio can't absorb would cut against the founder's own line."),
    },
    {
      id: "east-coast",
      date: "2026-02-10",
      kind: "press",
      title: "A second warehouse",
      theme: "Fulfilment",
      said: sourced("Northwind Fulfilment opened a second warehouse, in Pennsylvania, to cut delivery times to East Coast retailers.", "nw-fulfilment-pr"),
      implies: read("Two warehouses means network decisions: which makers' inventory goes where. Operations will be asked to make that call with data."),
    },
  ],
  hiring: [
    {
      id: "verification-lead",
      title: "Senior Manager, Seller Verification",
      team: "Marketplace Operations",
      location: "Remote (US)",
      posted: "2026-08",
      source: "nw-careers",
      signal: read("A dedicated verification leader, posted the same month as the first-order goal. The fast lane is already a priority."),
    },
    {
      id: "credit-analysts",
      title: "Credit Risk Analyst (two openings)",
      team: "Finance",
      posted: "2026-07",
      source: "nw-careers",
      signal: read("Finance is building out credit analytics, so limits will be modelled; the open question is who operates them."),
    },
    {
      id: "network-planners",
      title: "Fulfilment Network Planner (three openings)",
      team: "Fulfilment",
      location: "Portland, OR",
      posted: "2026-08",
      source: "nw-careers",
      signal: read("Three planners at once suggests a third site or a large inventory rebalance is coming."),
    },
    {
      id: "policy-lead",
      title: "Trust & Safety Policy Lead",
      team: "Trust & Safety",
      posted: "2026-09",
      source: "nw-careers",
      signal: read("Seller policy is being rewritten. Returns and disputes are the part this role touches."),
    },
  ],
} satisfies RecordInput;
