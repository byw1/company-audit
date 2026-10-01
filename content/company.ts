import { read, sourced, stat } from "@/lib/claims";
import type { CompanyInput } from "@/lib/schema/public";

/**
 * The company: what it is, how it makes money, the numbers that matter, and
 * the thesis in two minutes. FICTIONAL EXAMPLE: Northwind Commerce and every
 * figure below are invented.
 */
export default {
  oneLiner: sourced(
    "Northwind runs a wholesale marketplace where independent makers of home and kitchen goods sell to independent retailers, with net-60 payment terms that Northwind funds.",
    ["nw-10k-2025", "nw-about"],
  ),
  model: sourced(
    "It earns a commission on every wholesale order, plus seller subscriptions, a fulfilment service and promoted listings. It also carries the credit risk on retailer terms.",
    "nw-10k-2025",
  ),

  stats: [
    stat("$1.9B", sourced("Gross merchandise value in fiscal 2025, up 24% year on year", "nw-10k-2025")),
    stat("$312M", sourced("Net revenue in fiscal 2025, a 16.4% take rate on GMV", "nw-10k-2025")),
    stat("41,200", sourced("Active makers: at least one order in the trailing twelve months", "nw-10k-2025")),
    stat("2.1%", sourced("Credit losses on terms GMV in Q2 2026, up from 1.6% a year earlier", "nw-q2-call")),
  ],

  thesis: {
    headline: "Growth now depends on operations, not demand.",
    points: [
      {
        title: "The constraint moved to the supply side",
        fact: read(
          "Retailer demand is growing faster than new makers can get to a first order. Leadership has put a date on fixing it, which makes onboarding speed this role's first scoreboard.",
          { sources: ["nw-q2-letter", "nw-10k-2025"] },
        ),
      },
      {
        title: "Terms are the moat, and the risk",
        fact: read(
          "Net-60 terms win retailers, but credit losses are climbing while competitors raise money to copy them. Limits, collections and write-offs need an owner who treats them as an operating system, not a finance report.",
          { sources: ["nw-q2-call", "lark-series-d"] },
        ),
      },
      {
        title: "Fulfilment changes what operations means",
        fact: read(
          "With its own warehouses, Northwind now owns the parts of the order that used to be the maker's problem. Damage, late shipments and returns become Northwind's cost, and the role's.",
          { sources: ["nw-fulfilment-pr", "nw-10k-2025"] },
        ),
      },
    ],
  },

  overview: [
    sourced(
      "Founded in Portland in 2016, Northwind listed on the NYSE in 2024. It reports two segments: Marketplace (commission, subscriptions, ads) and Services (fulfilment and payments).",
      ["nw-10k-2025", "nw-ipo-pr"],
    ),
    sourced(
      "Retailers buy at wholesale with a $100 first-order minimum and pay in 60 days. Makers are paid within 7 days of shipping, so Northwind finances the gap.",
      "nw-10k-2025",
    ),
    sourced(
      "About 68,000 retailers placed an order in fiscal 2025, most of them single-location independent shops.",
      "nw-10k-2025",
    ),
    read(
      "The business is closer to a lender and a logistics operator than its marketplace label suggests, and the operating roles are where those three businesses meet.",
    ),
  ],

  timeline: [
    { date: "2016", title: "Founded in Portland", fact: sourced("Maya Okafor and Daniel Reyes start Northwind as a wholesale catalog for Pacific Northwest makers.", "nw-about") },
    { date: "2018", title: "Net-60 terms launch", fact: sourced("Retailers can pay 60 days after delivery; Northwind pays makers up front.", "nw-10k-2025") },
    { date: "2020-09", title: "Series C", fact: sourced("A $120M round led by Alder Peak Partners funds national expansion.", "nw-about") },
    { date: "2022", title: "Northwind Pro", fact: sourced("Paid seller subscriptions add analytics, lower commission on repeat orders and promoted listings.", "nw-10k-2025") },
    { date: "2024-05", title: "IPO on the NYSE", fact: sourced("Prices its IPO at $24 a share, raising $410M.", "nw-ipo-pr") },
    { date: "2025-11", title: "Investor Day", fact: sourced("Sets a medium-term target of an 18–19% take rate, led by Services.", "nw-investor-day") },
    { date: "2026-02", title: "East Coast warehouse", fact: sourced("Northwind Fulfilment opens a second warehouse, in Pennsylvania.", "nw-fulfilment-pr") },
    { date: "2026-08", title: "Time-to-first-order goal", fact: sourced("The Q2 letter commits to halving the time from approval to a maker's first order by the end of 2027.", "nw-q2-letter") },
  ],

  funding: [
    { date: "2017-04", round: "Series A", amount: stat("$9M", sourced("Series A", "nw-about")), fact: sourced("Led by Juniper Seed.", "nw-about") },
    { date: "2019-02", round: "Series B", amount: stat("$38M", sourced("Series B", "nw-about")), fact: sourced("Led by Bellwether Ventures.", "nw-about") },
    { date: "2020-09", round: "Series C", amount: stat("$120M", sourced("Series C", "nw-about")), fact: sourced("Led by Alder Peak Partners.", "nw-about") },
    { date: "2024-05", round: "IPO", amount: stat("$410M", sourced("Raised in the IPO", "nw-ipo-pr")), fact: sourced("NYSE: NWND, priced at $24.", "nw-ipo-pr") },
  ],

  leadership: [
    { name: "Maya Okafor", title: "Co-founder & CEO", fact: sourced("Previously ran merchant operations at a payments company.", "nw-about") },
    { name: "Daniel Reyes", title: "Co-founder & COO", fact: sourced("Owns operations, fulfilment and support. The role reports to him.", ["nw-about", "nw-jd"]) },
    { name: "Priya Raman", title: "Chief Financial Officer", fact: sourced("Joined in 2023 ahead of the IPO; owns the terms credit book.", "nw-about") },
    { name: "Tom Lindqvist", title: "Chief Product Officer", fact: sourced("Owns the marketplace, seller tools and search.", "nw-about") },
  ],

  businessModel: [
    sourced("Commission is charged to the maker on each wholesale order: higher on a retailer's first order, lower on repeat orders.", "nw-10k-2025"),
    sourced("Northwind Pro is a monthly seller subscription that lowers repeat-order commission and unlocks analytics and promoted listings.", "nw-10k-2025"),
    sourced("Northwind Fulfilment stores and ships makers' inventory for a per-order fee, from warehouses in Oregon and Pennsylvania.", ["nw-10k-2025", "nw-fulfilment-pr"]),
    read("Terms are a cost, not a product: there is no fee to the retailer, so credit losses come straight out of the commission margin."),
  ],

  revenueLines: [
    { name: "Commission", what: sourced("Charged to makers on wholesale orders.", "nw-10k-2025"), share: { value: 71, fact: sourced("71% of fiscal 2025 net revenue", "nw-10k-2025") } },
    { name: "Subscriptions", what: sourced("Northwind Pro seller plans.", "nw-10k-2025"), share: { value: 12, fact: sourced("12% of fiscal 2025 net revenue", "nw-10k-2025") } },
    { name: "Fulfilment", what: sourced("Per-order storage, pick, pack and ship.", "nw-10k-2025"), share: { value: 11, fact: sourced("11% of fiscal 2025 net revenue", "nw-10k-2025") } },
    { name: "Promoted listings", what: sourced("Makers pay to rank higher in retailer search.", "nw-10k-2025"), share: { value: 6, fact: sourced("6% of fiscal 2025 net revenue", "nw-10k-2025") } },
  ],
} satisfies CompanyInput;
