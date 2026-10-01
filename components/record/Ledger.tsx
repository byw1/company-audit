"use client";

import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface LedgerRow {
  id: string;
  theme?: string;
  node: ReactNode;
}

/** The record as a ledger, filterable by theme. Rows are rendered on the server; this only filters. */
export default function Ledger({ rows }: { rows: LedgerRow[] }) {
  const themes = useMemo(() => [...new Set(rows.map((r) => r.theme).filter(Boolean))] as string[], [rows]);
  const [theme, setTheme] = useState<string | null>(null);
  const shown = theme ? rows.filter((r) => r.theme === theme) : rows;

  return (
    <div>
      {themes.length > 1 && (
        <div className="no-print mb-4 flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by theme">
          {[null, ...themes].map((t) => (
            <button
              key={t ?? "all"}
              type="button"
              onClick={() => setTheme(t)}
              aria-pressed={theme === t}
              className={cn(
                "rounded-md border px-2.5 py-1 text-[12.5px] transition-colors",
                theme === t ? "border-ink bg-ink text-page" : "border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink",
              )}
            >
              {t ?? "All"}
              <span className="ml-1.5 font-mono text-[10.5px] opacity-60">{t ? rows.filter((r) => r.theme === t).length : rows.length}</span>
            </button>
          ))}
        </div>
      )}
      <div className="u-card u-rows overflow-hidden">
        {shown.map((r) => (
          <div key={r.id}>{r.node}</div>
        ))}
      </div>
    </div>
  );
}
