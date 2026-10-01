import { model, read, sourced } from "@/lib/claims";
import type { WorkflowsInput } from "@/lib/schema/public";

/**
 * The workflows the role owns, each derived from a JD line. How a marketplace
 * like this works is public; how Northwind staffs and runs each stage
 * internally is an outside-in read, and is labelled as one. FICTIONAL EXAMPLE.
 */
export default [
  {
    id: "onboard",
    name: "Get a new maker to a first order",
    jd: ["onboarding"],
    oneLiner: read(
      "From approval to the first wholesale order. Leadership has dated a goal on this one, so every stage is a lever on the scoreboard the role will be judged by.",
      { sources: ["nw-q2-letter"] },
    ),
    stages: [
      { id: "approve", name: "Application approved", owner: "Seller acquisition", detail: read("The maker clears brand and category review. Ownership passes to operations here.") },
      { id: "verify", name: "Verify the business", owner: "Seller onboarding", detail: sourced("Know-your-business checks: identity, tax and bank details before payouts can start.", "nw-10k-2025") },
      { id: "catalog", name: "Build the catalog", owner: "Maker, with onboarding", detail: read("Photos, wholesale prices, case packs and lead times. Quality here decides whether retailers find the maker at all.") },
      { id: "price", name: "Price check", owner: "Marketplace quality", detail: read("Wholesale price against suggested retail. Makers new to wholesale often price below what a shop can mark up.") },
      { id: "first-order", name: "First order", owner: "Marketplace", detail: sourced("The first order is the milestone the company reports on.", "nw-q2-letter") },
      { id: "ramp", name: "Ninety-day ramp", owner: "Seller onboarding", detail: read("Reorders, reviews and a first Pro upsell. A maker who stalls here rarely comes back.") },
    ],
    links: [{ from: "price", to: "catalog", label: "Reprice" }],
    leaks: [
      {
        id: "verify-backlog",
        at: "verify",
        severity: "high",
        what: sourced("Verification is the longest step: a median of 11 days in Q2, against 3 days to build a catalog.", "nw-q2-call"),
      },
      {
        id: "no-first-order",
        at: "first-order",
        severity: "high",
        what: sourced("About a third of approved makers had no order 60 days after approval.", "nw-q2-letter"),
      },
      { id: "underpriced", at: "price", severity: "medium", what: read("Makers who price below a retailer's margin get impressions but no orders, and look like a demand problem.") },
    ],
    kpis: [
      { name: "Days from approval to first order", why: "The number leadership has put a date on.", target: sourced("Halve it by the end of 2027.", "nw-q2-letter") },
      { name: "Share of makers with an order within sixty days", why: "Catches the stall before it becomes churn." },
      { name: "Verification cycle time", why: "The longest single step, and the most operational one." },
    ],
    firstMove: read(
      "Split verification into a fast lane for low-risk makers (clean tax and bank match) and a manual lane for the rest, then put a first-order offer in front of every maker the day they go live.",
    ),
  },
  {
    id: "catalog",
    name: "Keep the catalog worth searching",
    jd: ["catalog", "returns"],
    oneLiner: read("Listing quality is the retailer's whole experience of a maker. It decays quietly unless someone owns the standard."),
    stages: [
      { id: "create", name: "Listing created", owner: "Maker", detail: read("Titles, photos, prices, minimums and lead times, entered by the maker.") },
      { id: "auto-check", name: "Automated checks", owner: "Marketplace product", detail: sourced("Automated checks flag missing fields and prohibited items before a listing goes live.", "nw-10k-2025") },
      { id: "review", name: "Human review", owner: "Marketplace quality", detail: read("Spot checks on flagged listings and new categories.") },
      { id: "live", name: "Live in search", owner: "Marketplace product", detail: read("Ranking blends relevance, conversion and promoted placement.") },
      { id: "reaudit", name: "Periodic re-audit", owner: "Marketplace quality", detail: read("Stale lead times and out-of-stock items, caught after retailers complain.") },
    ],
    links: [{ from: "reaudit", to: "review", label: "Re-review" }],
    leaks: [
      { id: "stale-listings", at: "reaudit", severity: "medium", what: read("Lead times and stock go stale between audits, and a retailer finds out by ordering.") },
      { id: "no-return-signal", at: "live", severity: "medium", what: read("Return reasons don't feed back into a listing's ranking or its review queue.") },
    ],
    kpis: [
      { name: "Listings with a quality flag", why: "The standard, made visible." },
      { name: "Orders cancelled for stock or lead time", why: "The retailer-facing cost of a stale catalog." },
    ],
    firstMove: read("Use return and cancellation reasons as the re-audit queue: review the listings retailers have already told us are wrong, first."),
  },
  {
    id: "fulfil",
    name: "Ship every order on time and intact",
    jd: ["fulfilment"],
    oneLiner: read(
      "Two fulfilment models now run side by side: makers shipping themselves, and Northwind's own warehouses. The second turns every defect into Northwind's cost.",
      { sources: ["nw-fulfilment-pr"] },
    ),
    stages: [
      { id: "placed", name: "Order placed", owner: "Retailer", detail: read("Wholesale order against the maker's minimum, on terms.") },
      { id: "confirm", name: "Maker confirms", owner: "Maker", detail: sourced("Makers confirm within 3 business days or the order is auto-cancelled.", "nw-10k-2025") },
      { id: "pack", name: "Pick and pack", owner: "Maker or Northwind Fulfilment", detail: read("Self-shipped by the maker, or picked from a Northwind warehouse.") },
      { id: "ship", name: "Carrier", owner: "Carrier partners", detail: read("Parcel for most orders, freight for large ones.") },
      { id: "deliver", name: "Delivered and checked", owner: "Retailer", detail: read("The retailer opens the box. Damage and short shipments show up here, not at the warehouse.") },
    ],
    links: [{ from: "deliver", to: "pack", label: "Replacement" }],
    leaks: [
      { id: "late-confirm", at: "confirm", severity: "medium", what: read("Orders sit unconfirmed for days, and the auto-cancel arrives after the retailer has planned around them.") },
      {
        id: "damage",
        at: "deliver",
        severity: "high",
        what: sourced("Damage in transit was the top return reason in fiscal 2025, at 31% of claims.", "nw-10k-2025"),
      },
    ],
    kpis: [
      { name: "On-time ship rate", why: "The promise the retailer actually feels." },
      { name: "Defect rate per thousand orders", why: "Damage, short and wrong items, in one number." },
      { name: "Fulfilment cost per order", why: "Whether the warehouses make money at all." },
    ],
    firstMove: read("Set a packaging standard for the categories that break (ceramics and glass first), and enforce it at confirmation for self-shipped makers."),
  },
  {
    id: "returns",
    name: "Settle returns and disputes fairly",
    jd: ["returns", "fulfilment"],
    oneLiner: read("Every dispute is decided three ways: who pays, what the retailer learns about Northwind, and whether the maker stays."),
    stages: [
      { id: "claim", name: "Claim filed", owner: "Retailer", detail: sourced("Retailers can file a claim within 30 days of delivery.", "nw-10k-2025") },
      { id: "triage", name: "Triage", owner: "Offshore support partner", detail: read("Sorted by reason and value; low-value claims are likely auto-approved.") },
      { id: "evidence", name: "Evidence", owner: "Trust & Safety", detail: read("Photos from the retailer, tracking and packing records from the maker.") },
      { id: "decide", name: "Decision", owner: "Trust & Safety", detail: read("Refund, credit, replacement or denial.") },
      { id: "settle", name: "Settle", owner: "Finance", detail: read("Charge back to the maker, the carrier, or absorb it.") },
    ],
    leaks: [
      { id: "absorbed", at: "settle", severity: "high", what: read("When the fault is unclear, Northwind likely absorbs the cost, which hides who is actually causing it.") },
      { id: "no-feedback", at: "decide", severity: "medium", what: read("Decisions don't flow back to the catalog or to packaging standards, so the same claim repeats.") },
    ],
    kpis: [
      { name: "Claims per thousand orders", why: "Volume, normalised for growth." },
      { name: "Share of claim cost recovered", why: "From makers and carriers, not absorbed." },
    ],
    firstMove: read("Tag every decided claim with a root cause and an owner, then route repeat causes to the catalog and fulfilment workflows instead of paying them again."),
  },
  {
    id: "terms",
    name: "Run the terms book",
    jd: ["terms"],
    oneLiner: read(
      "Net-60 terms are the reason retailers choose Northwind. They are also a lending business that the operations team runs every day.",
      { sources: ["nw-10k-2025"] },
    ),
    stages: [
      { id: "check", name: "Credit check", owner: "Finance & credit", detail: sourced("New retailers get a starting limit from a credit check and their order history.", "nw-10k-2025") },
      { id: "limit", name: "Limit set", owner: "Finance & credit", detail: read("Limits probably refresh on a schedule, not on behaviour.") },
      { id: "order", name: "Order on terms", owner: "Retailer", detail: read("Most orders are placed on terms.") },
      { id: "payout", name: "Maker paid", owner: "Finance", detail: sourced("Makers are paid within 7 days of shipping.", "nw-10k-2025") },
      { id: "due", name: "Invoice due", owner: "Retailer", detail: read("Sixty days after delivery.") },
      { id: "collect", name: "Collections", owner: "Ops and Finance", detail: read("Reminders, then the support partner, then an agency.") },
      { id: "write-off", name: "Write-off", owner: "Finance", detail: sourced("Credit losses reached 2.1% of terms GMV in Q2 2026.", "nw-q2-call") },
    ],
    links: [{ from: "collect", to: "limit", label: "Cut limit" }],
    leaks: [
      { id: "stale-limits", at: "limit", severity: "high", what: read("Limits that refresh on a schedule let a retailer who is already late keep ordering.") },
      { id: "late-collections", at: "collect", severity: "medium", what: read("Collections that start after the due date start too late for a shop that is short of cash.") },
    ],
    kpis: [
      { name: "Credit losses on terms GMV", why: "The number the CFO is now asked about on calls.", target: sourced("2.1% in Q2 2026, up from 1.6%.", "nw-q2-call") },
      { name: "Share of terms GMV more than thirty days late", why: "The early warning before it becomes a write-off." },
    ],
    firstMove: model(
      "Refresh limits on behaviour, not the calendar. For example, if 4% of retailers drive half of late balances, freezing new orders at fifteen days late moves losses more than any collections script would.",
      { note: "Illustrative: the 4% and fifteen-day figures are invented to show the mechanism." },
    ),
  },
  {
    id: "wbr",
    name: "Run the weekly business review",
    jd: ["cadence", "team"],
    oneLiner: read("A team of about forty, across five workflows and a partner, needs one weekly place where numbers get owners and owners make decisions."),
    stages: [
      { id: "pull", name: "Numbers pulled", owner: "Ops analytics", detail: read("One metric set per workflow, same definitions every week.") },
      { id: "own", name: "Owners annotate", owner: "Workflow owners", detail: read("Each owner explains their movement before the meeting, not in it.") },
      { id: "review", name: "Review", owner: "Head of Marketplace Ops", detail: read("Thirty minutes on exceptions, not a tour of every chart.") },
      { id: "act", name: "Actions", owner: "Workflow owners", detail: read("Each action has one owner and a date.") },
      { id: "follow", name: "Follow-up", owner: "Ops analytics", detail: read("Last week's actions are the first slide.") },
    ],
    links: [{ from: "follow", to: "pull", label: "Next week" }],
    leaks: [{ id: "no-owner", at: "act", severity: "medium", what: read("Actions assigned to a team rather than a person tend to come back unchanged the next week.") }],
    kpis: [
      { name: "Actions closed on time", why: "Whether the review changes anything." },
      { name: "Forecast accuracy", why: "Whether the team understands its own system." },
    ],
    firstMove: read("Start the review in week one with whatever numbers exist, and fix definitions as they're argued over. Waiting for perfect data is how a review never starts."),
  },
] satisfies WorkflowsInput;
