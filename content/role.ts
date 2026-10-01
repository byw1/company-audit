import { quote, read, sourced } from "@/lib/claims";
import type { RoleInput } from "@/lib/schema/public";

/**
 * The role: the JD broken into responsibilities (quoted from the posting, so
 * they're sourced), the requirements, and where the role sits in the org.
 * FICTIONAL EXAMPLE.
 */
export default {
  summary: read(
    "The operator who owns everything between a maker being approved and a retailer paying: onboarding, catalog quality, fulfilment, returns and the terms book, with Finance and Trust & Safety as partners.",
    { sources: ["nw-jd"] },
  ),

  responsibilities: [
    {
      id: "onboarding",
      area: "Seller onboarding",
      jd: quote("Own seller onboarding end to end, from an approved application to a maker’s first wholesale order.", "nw-jd"),
    },
    {
      id: "catalog",
      area: "Catalog quality",
      jd: quote("Set and enforce the standards for listing quality and catalog health across more than 40,000 makers.", "nw-jd"),
    },
    {
      id: "fulfilment",
      area: "Fulfilment",
      jd: quote("Run order fulfilment performance, including on-time shipping, defect rates and the growth of Northwind Fulfilment.", "nw-jd"),
    },
    {
      id: "returns",
      area: "Returns and disputes",
      jd: quote("Partner with Trust & Safety on returns, disputes and the enforcement of seller policy.", "nw-jd"),
    },
    {
      id: "terms",
      area: "Terms and collections",
      jd: quote("Manage the operating side of net-60 terms with Finance: credit limits, collections and write-offs.", "nw-jd"),
    },
    {
      id: "team",
      area: "Team",
      jd: quote("Lead a team of about 40 operations managers and analysts, and our offshore support partner.", "nw-jd"),
    },
    {
      id: "cadence",
      area: "Operating cadence",
      jd: quote("Build the operating cadence: weekly business reviews, clear KPI ownership and forecasting.", "nw-jd"),
    },
  ],

  requirements: [
    { id: "experience", jd: quote("8+ years in marketplace or e-commerce operations, including 3+ years leading managers.", "nw-jd") },
    { id: "data", jd: quote("Comfortable building operating metrics from raw data and making decisions from them.", "nw-jd") },
    { id: "cross-functional", jd: quote("A track record of running cross-functional programs with Product, Finance and Trust & Safety.", "nw-jd") },
    { id: "scale", jd: quote("Experience scaling operations through process, automation and outsourced partners.", "nw-jd") },
  ],

  placement: {
    above: [
      { id: "ceo", label: "CEO", person: "Maya Okafor", note: sourced("Co-founder; the COO reports to her.", "nw-about") },
    ],
    reportsTo: {
      id: "coo",
      label: "COO",
      person: "Daniel Reyes",
      note: sourced("The posting says the role reports to the COO.", "nw-jd"),
    },
    role: {
      note: read("The single owner of the order lifecycle after a maker is approved. Today that ownership looks split across several teams."),
    },
    peers: [
      { id: "fulfilment-network", label: "Fulfilment network", note: read("Runs the warehouses themselves; likely a peer under the COO, given the job posts for network planners.") },
      { id: "support", label: "Customer support", note: sourced("Support also reports to the COO, per the leadership page.", "nw-about") },
    ],
    reports: [
      { id: "onboarding-team", label: "Seller onboarding", note: sourced("Named in the posting's team description.", "nw-jd") },
      { id: "marketplace-quality", label: "Marketplace quality", note: sourced("Named in the posting's team description.", "nw-jd") },
      { id: "ops-analytics", label: "Ops analytics", note: read("Implied by the KPI and forecasting responsibilities.") },
      { id: "offshore-partner", label: "Offshore support partner", note: sourced("The posting names an outsourced support partner.", "nw-jd") },
    ],
    upstream: [
      { id: "seller-acquisition", label: "Seller acquisition", note: read("Sales brings approved makers in; the role picks them up at approval.") },
      { id: "product", label: "Marketplace product", note: sourced("The posting names Product as a key partner.", "nw-jd") },
    ],
    downstream: [
      { id: "finance", label: "Finance & credit", note: sourced("Owns the terms book with the role, per the posting.", "nw-jd") },
      { id: "trust-safety", label: "Trust & Safety", note: sourced("Partners on returns, disputes and policy, per the posting.", "nw-jd") },
      { id: "retailer-success", label: "Retailer success", note: read("Feels every late shipment and dispute decision first.") },
    ],
  },
} satisfies RoleInput;
