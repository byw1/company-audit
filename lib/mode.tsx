"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  createContext,
  useContext,
  useMemo,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

interface Mode {
  share: boolean;
  prepAllowed: boolean;
}

const ModeCtx = createContext<Mode>({ share: true, prepAllowed: false });

/**
 * The view is decided on the server (see middleware.ts) and handed down.
 * Client code can't unlock the prep view; it can only read the decision.
 */
export function ModeProvider({ children, mode }: { children: ReactNode; mode: Mode }) {
  return <ModeCtx.Provider value={mode}>{children}</ModeCtx.Provider>;
}

export function useMode() {
  return useContext(ModeCtx);
}

export function useShare() {
  return useContext(ModeCtx).share;
}

export function usePrepAllowed() {
  return useContext(ModeCtx).prepAllowed;
}

/** While previewing the share view from prep, links keep the preview on. */
export function TLink({
  href,
  children,
  ...rest
}: Omit<ComponentPropsWithoutRef<typeof Link>, "href"> & { href: string }) {
  const { share, prepAllowed } = useContext(ModeCtx);
  return (
    <Link href={prepAllowed && share ? withShare(href) : href} {...rest}>
      {children}
    </Link>
  );
}

export function withShare(href: string) {
  if (/^[a-z]+:/i.test(href)) return href;
  const [base, hash] = href.split("#");
  if (/[?&]share(=|&|$)/.test(base)) return href;
  const q = base.includes("?") ? `${base}&share` : `${base}?share`;
  return hash ? `${q}#${hash}` : q;
}

/** The href that flips the current page between prep and the share preview. */
export function useToggleHref() {
  const share = useShare();
  const pathname = usePathname();
  const params = useSearchParams();
  return useMemo(() => {
    const next = new URLSearchParams(params.toString());
    if (share) next.delete("share");
    else next.set("share", "");
    const qs = next.toString().replace(/=(?=&|$)/g, "");
    return qs ? `${pathname}?${qs}` : pathname;
  }, [share, pathname, params]);
}
