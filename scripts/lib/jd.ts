/**
 * Fetch a job posting verbatim and check it's still listed on the company's
 * careers index, not just reachable at its URL (postings often outlive their
 * listing). Ashby, Greenhouse and Lever have public JSON APIs for both; any
 * other URL falls back to the page's text, with the index check left to you.
 */

export interface Posting {
  url: string;
  board: "ashby" | "greenhouse" | "lever" | "page";
  title: string;
  location?: string;
  team?: string;
  published?: string; // YYYY-MM-DD
  /** The careers index the role was checked against. */
  indexUrl?: string;
  /** true: listed on the index; false: not listed (likely closed); null: couldn't check. */
  onIndex: boolean | null;
  /** The posting's text, verbatim apart from whitespace. */
  text: string;
}

const UA = { "user-agent": "company-audit (job posting check)" };

async function json<T>(url: string): Promise<T> {
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`${url} returned ${r.status}`);
  return r.json() as Promise<T>;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };
const decode = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (ENTITIES[e.toLowerCase()]) return ENTITIES[e.toLowerCase()];
    if (e[0] === "#") return String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return m;
  });

/** HTML to readable text: headings and paragraphs on their own lines, list items as "- ". */
export function htmlToText(html: string) {
  return tidy(
    decode(
      html
        .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
        .replace(/<li[^>]*>/gi, "\n- ")
        .replace(/<h[1-6][^>]*>/gi, "\n\n## ")
        .replace(/<\/(p|div|h[1-6]|ul|ol|section|article)>/gi, "\n\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, ""),
    ),
  );
}

/** Normalise whitespace (non-breaking spaces, trailing spaces, runs of blank lines) and nothing else. */
export function tidy(s: string) {
  return s
    .replace(/ /g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+(?=- )/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const day = (s?: string) => (s ? new Date(s).toISOString().slice(0, 10) : undefined);

async function ashby(org: string, id: string, url: string): Promise<Posting> {
  const board = await json<{ jobs: { id: string; title: string; location?: string; department?: string; team?: string; publishedAt?: string; descriptionPlain?: string; descriptionHtml?: string }[] }>(
    `https://api.ashbyhq.com/posting-api/job-board/${org}?includeCompensation=true`,
  );
  const job = board.jobs.find((j) => j.id === id);
  if (!job) return { url, board: "ashby", title: "", onIndex: false, indexUrl: `https://jobs.ashbyhq.com/${org}`, text: "" };
  return {
    url,
    board: "ashby",
    title: job.title,
    location: job.location,
    team: job.department ?? job.team,
    published: day(job.publishedAt),
    indexUrl: `https://jobs.ashbyhq.com/${org}`,
    onIndex: true,
    text: job.descriptionHtml ? htmlToText(job.descriptionHtml) : tidy(job.descriptionPlain ?? ""),
  };
}

async function greenhouse(org: string, id: string, url: string): Promise<Posting> {
  const list = await json<{ jobs: { id: number }[] }>(`https://boards-api.greenhouse.io/v1/boards/${org}/jobs`);
  const onIndex = list.jobs.some((j) => String(j.id) === id);
  const job = await json<{ title: string; location?: { name?: string }; departments?: { name: string }[]; updated_at?: string; first_published?: string; content: string }>(
    `https://boards-api.greenhouse.io/v1/boards/${org}/jobs/${id}?content=true`,
  ).catch(() => null);
  return {
    url,
    board: "greenhouse",
    title: job?.title ?? "",
    location: job?.location?.name,
    team: job?.departments?.[0]?.name,
    published: day(job?.first_published ?? job?.updated_at),
    indexUrl: `https://job-boards.greenhouse.io/${org}`,
    onIndex,
    // Greenhouse escapes the HTML once more inside the JSON string.
    text: job ? htmlToText(decode(job.content)) : "",
  };
}

async function lever(org: string, id: string, url: string): Promise<Posting> {
  const list = await json<{ id: string }[]>(`https://api.lever.co/v0/postings/${org}?mode=json`);
  const onIndex = list.some((j) => j.id === id);
  const job = await json<{
    text: string;
    categories?: { location?: string; team?: string };
    createdAt?: number;
    description?: string;
    lists?: { text: string; content: string }[];
    additional?: string;
  }>(`https://api.lever.co/v0/postings/${org}/${id}`).catch(() => null);
  const parts = job ? [job.description ?? "", ...(job.lists ?? []).map((l) => `<h3>${l.text}</h3><ul>${l.content}</ul>`), job.additional ?? ""] : [];
  return {
    url,
    board: "lever",
    title: job?.text ?? "",
    location: job?.categories?.location,
    team: job?.categories?.team,
    published: job?.createdAt ? day(new Date(job.createdAt).toISOString()) : undefined,
    indexUrl: `https://jobs.lever.co/${org}`,
    onIndex,
    text: htmlToText(parts.join("\n")),
  };
}

async function page(url: string): Promise<Posting> {
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`${url} returned ${r.status}`);
  const html = await r.text();
  const title = decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "").trim();
  const main = html.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? html.match(/<body[\s\S]*?<\/body>/i)?.[0] ?? html;
  return { url, board: "page", title, onIndex: null, text: htmlToText(main) };
}

export async function fetchPosting(url: string): Promise<Posting> {
  const u = new URL(url);
  const parts = u.pathname.split("/").filter(Boolean);
  if (u.hostname === "jobs.ashbyhq.com" && parts.length >= 2) return ashby(parts[0], parts[1], url);
  if (/(^|\.)greenhouse\.io$/.test(u.hostname)) {
    const i = parts.indexOf("jobs");
    const id = u.searchParams.get("gh_jid") ?? (i >= 0 ? parts[i + 1] : undefined);
    const org = u.searchParams.get("for") ?? parts[0];
    if (org && id) return greenhouse(org, id, url);
  }
  if (u.hostname === "jobs.lever.co" && parts.length >= 2) return lever(parts[0], parts[1], url);
  return page(url);
}

/** content/jd.md: a header recording where and when the role was checked, then the posting verbatim. */
export function jdMarkdown(p: Posting, company: string, checked: string) {
  const index =
    p.onIndex === true
      ? `- **Seen on the careers index:** ${p.indexUrl}`
      : p.onIndex === false
        ? `- **NOT on the careers index** (${p.indexUrl}): the role may be closed.`
        : "- **Careers index:** not checked automatically. Find the role on the company's list of open roles and record the URL here.";
  return [
    `# ${p.title || "Job posting"}: ${company}`,
    "",
    `- **Posting:** ${p.url}`,
    index,
    `- **Checked:** ${checked}`,
    "",
    "Text below is verbatim from the posting; only whitespace was normalised.",
    "",
    "---",
    "",
    p.text,
    "",
  ].join("\n");
}
