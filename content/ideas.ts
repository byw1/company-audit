import { read } from "@/lib/claims";
import type { IdeasInput } from "@/lib/schema/public";

/**
 * What I'd do. Every initiative traces to a workflow leak, something the
 * company said publicly, or a competitor's move; the validator fails the
 * build if a trace doesn't resolve. Impact and effort are my estimates.
 * FICTIONAL EXAMPLE.
 */
export default {
  items: [
    {
      id: "verify-fast-lane",
      title: "A fast lane for low-risk verification",
      summary: read("Auto-approve makers whose tax and bank details match cleanly; route the rest to a manual queue with a service level."),
      impact: 5,
      effort: 2,
      traces: ["leak:onboard/verify-backlog", "record:q2-first-order"],
      measure: "Median verification time, by lane",
    },
    {
      id: "first-order-offer",
      title: "A first-order offer for every new maker",
      summary: read("A retailer incentive on a new maker's first order, funded from the first-order commission, shown the day the maker goes live."),
      impact: 5,
      effort: 3,
      traces: ["leak:onboard/no-first-order", "record:q2-first-order", "competitor:harbor"],
      measure: "Share of makers with an order within sixty days",
    },
    {
      id: "behaviour-limits",
      title: "Credit limits that move with behaviour",
      summary: read("Refresh limits on payment behaviour instead of a schedule, and pause new terms orders early for retailers who are already late."),
      impact: 5,
      effort: 4,
      traces: ["leak:terms/stale-limits", "record:q2-credit", "competitor:larkspur"],
      measure: "Credit losses on terms GMV",
    },
    {
      id: "packaging-standard",
      title: "A packaging standard for fragile categories",
      summary: read("Start with ceramics and glass: a required packing spec at order confirmation for self-shipped makers, and the same spec in our own warehouses."),
      impact: 4,
      effort: 2,
      traces: ["leak:fulfil/damage", "record:10k-damage"],
      measure: "Damage claims per thousand orders, in fragile categories",
    },
    {
      id: "claims-root-cause",
      title: "Root-cause every claim, then route it",
      summary: read("Tag decided claims with a cause and an owner, and send repeat causes to the catalog and fulfilment queues instead of paying them again."),
      impact: 3,
      effort: 1,
      traces: ["leak:returns/no-feedback", "leak:returns/absorbed", "leak:catalog/no-return-signal"],
      measure: "Share of claim cost recovered",
    },
    {
      id: "tradefold-integration",
      title: "Put Northwind makers inside Tradefold",
      summary: read("A catalog integration so retailers buying in Tradefold see Northwind makers, on Northwind terms."),
      impact: 3,
      effort: 4,
      traces: ["competitor:tradefold"],
      measure: "Orders placed through the integration",
    },
    {
      id: "owned-wbr",
      title: "A weekly review with named owners",
      summary: read("One page per workflow, owners annotate before the meeting, and every action has one name and one date."),
      impact: 3,
      effort: 1,
      traces: ["leak:wbr/no-owner"],
      measure: "Actions closed on time",
    },
  ],
  plan: [
    {
      window: "30",
      title: "Learn the book",
      goal: "Know where every workflow leaks, from the team's own numbers.",
      actions: [
        "Sit with each team and the offshore partner; walk one order end to end.",
        "Start the weekly review with the numbers that exist today.",
        "Baseline verification time, first-order rate, defect rate and late terms balances.",
      ],
      ideas: ["owned-wbr"],
    },
    {
      window: "60",
      title: "Fix the biggest leak",
      goal: "Ship the two changes with the clearest line to the dated goal.",
      actions: [
        "Launch the verification fast lane for low-risk makers.",
        "Begin root-cause tagging on every decided claim.",
        "Agree the packaging standard with the fragile categories' top makers.",
      ],
      ideas: ["verify-fast-lane", "claims-root-cause", "packaging-standard"],
    },
    {
      window: "90",
      title: "Then grow",
      goal: "Turn the fixes into the numbers leadership reports on.",
      actions: [
        "Pilot the first-order offer with one category.",
        "Bring a behaviour-based limit proposal to Finance, with the data behind it.",
        "Publish the first monthly operations scorecard to the leadership team.",
      ],
      ideas: ["first-order-offer", "behaviour-limits"],
    },
  ],
} satisfies IdeasInput;
