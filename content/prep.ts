import "server-only";
import type { PrepInput } from "@/lib/schema/prep";

/**
 * PREP ONLY. Never rendered or shipped without the prep key.
 *
 * `server-only` fails the build if this file is ever pulled into a client
 * bundle; eslint.config.mjs fails lint if public code imports it; and
 * `npm run verify:share` crawls the built site to prove none of it leaks.
 *
 * Anything about me follows the guardrails in CLAUDE.md: real numbers only,
 * leadership scope first, evidence from my own records.
 *
 * FICTIONAL EXAMPLE: written for the invented Northwind role to show the
 * format. /new-audit replaces all of it.
 */
export default {
  talkTrack: [
    {
      chapter: "overview",
      time: "0:00",
      say: "Open on the thesis, not the hero. “I wanted to understand the business before talking about the job. My read is that growth now depends on operations, not demand.”",
      ask: "Is that how it feels from the inside, or is demand still the constraint?",
    },
    {
      chapter: "company",
      time: "0:45",
      say: "Point at the org map. “This is my guess at where the role sits. The highlighted box owns the order after approval. Tell me where I’ve drawn the lines wrong.”",
      show: "The org map, then the revenue mix",
    },
    {
      chapter: "workflows",
      time: "1:45",
      say: "Open the onboarding workflow. “Verification is the longest step and the most operational, so it’s the first thing I’d look at.”",
      ask: "How is verification staffed today, and who owns the backlog?",
    },
    {
      chapter: "record",
      time: "2:45",
      say: "Read the first-order goal aloud, then the credit-loss line. “Two of the three things leadership has said publicly land on this role.”",
    },
    {
      chapter: "competitors",
      time: "3:30",
      say: "Larkspur first. “They raised money to copy terms. I’d compete on the quality of limit decisions, not on the size of limits.”",
    },
    {
      chapter: "ideas",
      time: "4:15",
      say: "Walk the 30/60/90, then stop. “A plan written from the outside is a hypothesis. The first month is for finding out where this one is wrong.”",
      ask: "Which of these would you cut first?",
    },
  ],
  likelyQuestions: [
    {
      q: "How would you cut time to first order in half?",
      outline: "Decompose before acting: verification, catalog, pricing, first order. Attack the longest operational step first (verification). Then put a first-order offer in front of every new maker. Measure by cohort, not by average.",
      story: "Pick the strongest story from your record where you shortened a cycle time by changing the process, not the headcount.",
    },
    {
      q: "Credit losses are up half a point. What would you do in your first month?",
      outline: "Separate mix from behaviour: are losses up because of new retailers, or because existing ones are paying later? Then look at how limits refresh. Don’t promise a number before seeing the cohort data.",
    },
    {
      q: "Tell me about a team you built or rebuilt.",
      outline: "Scope first: how many people, what changed, what the numbers did. Then the hiring decision you’re proudest of.",
    },
  ],
  pushback: [
    {
      push: "You haven’t run a marketplace this size.",
      answer: "Agree with the fact, then move to the transferable part: the operating cadence, the cross-functional programs, and the evidence on this site that I understand this business specifically.",
    },
    {
      push: "Terms are Finance’s problem, not operations’.",
      answer: "Finance owns the model; someone has to own the decisions it produces every day. Ask how limit changes reach the support partner today.",
    },
  ],
  gaps: [
    {
      requirement: "experience",
      gap: "The posting asks for 8+ years in marketplace operations.",
      handle: "Don’t argue the number. Name the distance, then let the audit make the case.",
    },
  ],
  whosWho: [
    { name: "Daniel Reyes", title: "Co-founder & COO", note: "The hiring manager. Ran operations from day one; likely to probe how I’d run the weekly review." },
    { name: "Priya Raman", title: "CFO", note: "Owns the credit book. Expect questions on terms, limits and how ops and finance split the work." },
  ],
  questionsForThem: [
    {
      q: "The Q2 letter dates the first-order goal to the end of 2027. What does the plan behind it look like today?",
      why: "Shows I read the letter, and finds out whether the role owns the plan or inherits it.",
      source: "nw-q2-letter",
    },
    {
      q: "Who changes a retailer’s credit limit today, and how often?",
      why: "The answer tells me whether terms is an operations job here yet.",
      source: "nw-q2-call",
    },
    {
      q: "How do the warehouse teams and this role split ownership of a damaged order?",
      why: "Finds the seam between fulfilment and marketplace operations.",
    },
  ],
  careful: [
    "Don’t lead with credit losses; let them raise it.",
    "The fulfilment network roles may report elsewhere. Ask how the seats relate rather than guessing out loud.",
  ],
  numbers: [
    { n: "$1.9B / $312M", what: "Fiscal 2025 GMV and net revenue (16.4% take rate)" },
    { n: "41,200", what: "Active makers, trailing twelve months" },
    { n: "2.1%", what: "Credit losses on terms GMV, Q2 2026 (1.6% a year earlier)" },
    { n: "11 days", what: "Median verification time in Q2" },
  ],
  checklist: [
    "Open the site in the share view once before the call, so I know exactly what they see.",
    "Have the onboarding workflow open, ready to walk.",
    "Pick the two questions for them I most want answered.",
  ],
} satisfies PrepInput;
