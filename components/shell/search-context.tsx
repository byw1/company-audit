"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SearchItem } from "@/lib/search-types";

interface Ctx {
  items: SearchItem[];
  register: (key: string, items: SearchItem[]) => void;
  unregister: (key: string) => void;
}

const SearchCtx = createContext<Ctx>({ items: [], register: () => {}, unregister: () => {} });

/** Holds the ⌘K index: the public items from the server, plus any registered later (the prep layer's). */
export function SearchProvider({ base, children }: { base: SearchItem[]; children: ReactNode }) {
  const [extra, setExtra] = useState<Record<string, SearchItem[]>>({});
  const value = useMemo<Ctx>(
    () => ({
      items: [...base, ...Object.values(extra).flat()],
      register: (key, items) => setExtra((e) => ({ ...e, [key]: items })),
      unregister: (key) =>
        setExtra((e) => {
          const next = { ...e };
          delete next[key];
          return next;
        }),
    }),
    [base, extra],
  );
  return <SearchCtx.Provider value={value}>{children}</SearchCtx.Provider>;
}

export function useSearchItems() {
  return useContext(SearchCtx).items;
}

/** Adds items to the palette while mounted. Used by the prep layer. */
export function RegisterSearchItems({ id, items }: { id: string; items: SearchItem[] }) {
  const { register, unregister } = useContext(SearchCtx);
  useEffect(() => {
    register(id, items);
    return () => unregister(id);
  }, [id, items, register, unregister]);
  return null;
}
