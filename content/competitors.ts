import { read, sourced, stat } from "@/lib/claims";
import type { CompetitorsInput } from "@/lib/schema/public";

/**
 * The field, where each player sits, and where each is heading on the
 * evidence of their own public moves in the last twelve months. Positions on
 * the map are my placement (an outside-in read); the moves are sourced.
 * FICTIONAL EXAMPLE: every competitor below is invented.
 */
export default {
  axes: {
    x: { label: "Who they sell to", low: "Consumers", high: "Retailers" },
    y: { label: "How much of the order they run", low: "Listings only", high: "Full stack" },
  },
  self: {
    now: { x: 72, y: 62 },
    heading: { x: 74, y: 80 },
    why: read("Fulfilment and terms push Northwind toward running the whole order, while it stays wholesale-first.", {
      sources: ["nw-fulfilment-pr", "nw-investor-day"],
    }),
  },
  field: [
    {
      id: "larkspur",
      name: "Larkspur Wholesale",
      domain: "larkspur.example",
      kind: "Wholesale marketplace",
      tags: ["Venture-backed", "Terms"],
      oneLiner: sourced("A wholesale marketplace for independent brands, funded to extend retailer credit.", "lark-series-d"),
      now: { x: 86, y: 42 },
      heading: { x: 86, y: 66 },
      threat: "high",
      moves: [
        { date: "2026-06", fact: sourced("Raised a Series D earmarked for retailer credit lines.", "lark-series-d") },
      ],
      direction: read("Copying Northwind's terms with new money, which means a price war on credit is likely within a year."),
      threatRead: read("The most direct threat: same buyers, and now the same financing hook."),
      response: read("Compete on decisions, not on limits: faster, behaviour-based limits that let good retailers buy more, while late ones are cut early."),
      stats: [stat("Series D", sourced("Latest round, June 2026", "lark-series-d"))],
    },
    {
      id: "harbor",
      name: "Harbor & Co.",
      domain: "harbor.example",
      kind: "Curated consumer marketplace",
      tags: ["Consumer", "Brand-led"],
      oneLiner: sourced("A curated home-goods marketplace for consumers that has opened a wholesale channel.", "harbor-wholesale"),
      now: { x: 18, y: 58 },
      heading: { x: 42, y: 60 },
      threat: "medium",
      moves: [{ date: "2026-03", fact: sourced("Launched Harbor Wholesale for its existing makers.", "harbor-wholesale") }],
      direction: read("Moving into wholesale with makers it already has, so the first fight is for the same makers, not the same retailers."),
      threatRead: read("A supply-side threat. Makers who list with both will compare onboarding, payout speed and fees."),
      response: read("Win the maker's first ninety days: if Northwind gets them a first order faster, dual listing stops mattering."),
    },
    {
      id: "mercato",
      name: "Mercato Makers",
      domain: "mercato.example",
      kind: "European maker marketplace",
      tags: ["International", "Listings"],
      oneLiner: sourced("A European marketplace for small-batch makers that entered the US this year.", "mercato-us"),
      now: { x: 62, y: 28 },
      heading: { x: 70, y: 34 },
      threat: "low",
      moves: [{ date: "2026-01", fact: sourced("Launched in the United States with a no-commission first year for makers.", "mercato-us") }],
      direction: read("Buying supply with a commission holiday; no sign yet of terms or fulfilment."),
      threatRead: read("Low for now. A commission holiday attracts makers but doesn't keep retailers."),
      response: read("Watch maker churn to Mercato by category; respond with Pro pricing only where it shows up."),
    },
    {
      id: "tradefold",
      name: "Tradefold",
      domain: "tradefold.example",
      kind: "Retail procurement software",
      tags: ["Software", "Retailer-side"],
      oneLiner: sourced("Purchasing and inventory software for independent retailers, now piloting a supplier marketplace.", "tradefold-marketplace"),
      now: { x: 94, y: 16 },
      heading: { x: 92, y: 38 },
      threat: "medium",
      moves: [{ date: "2026-07", fact: sourced("Opened a supplier marketplace in beta inside its purchasing tool.", "tradefold-marketplace") }],
      direction: read("Turning the retailer's software into the place they buy, which would put Northwind one step further from the retailer."),
      threatRead: read("A demand-side threat with a long fuse: it owns the retailer's workflow already."),
      response: read("Partner before competing: a catalog integration so Northwind makers appear inside Tradefold on Northwind terms."),
    },
    {
      id: "shelfwise",
      name: "Shelfwise",
      domain: "shelfwise.example",
      kind: "Fulfilment platform",
      tags: ["Fulfilment", "Software"],
      oneLiner: sourced("Inventory software for small brands that has added a shared fulfilment network.", "shelfwise-network"),
      now: { x: 50, y: 84 },
      heading: { x: 58, y: 90 },
      threat: "medium",
      moves: [{ date: "2025-12", fact: sourced("Launched a shared fulfilment network for brands on its software.", "shelfwise-network") }],
      direction: read("Competing for the maker's inventory, which is the asset Northwind Fulfilment needs to grow."),
      threatRead: read("Threatens the Services growth story more than the marketplace."),
      response: read("Make Northwind Fulfilment the obvious choice for wholesale-heavy makers: fewer defects and faster payouts, measured and published."),
    },
  ],
  openings: [
    read("No competitor yet combines terms, fulfilment and a maker-first policy. That combination is Northwind's to lose."),
    read("Everyone is buying supply with discounts; nobody is competing on how fast a new maker gets a first order."),
  ],
} satisfies CompetitorsInput;
