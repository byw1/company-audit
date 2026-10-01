import "server-only";
import { headers } from "next/headers";

export interface View {
  /** The visitor holds the prep key. */
  prepAllowed: boolean;
  /** Render the public view. True for everyone without the key, and for key holders previewing with ?share. */
  share: boolean;
}

/** Server-side view, as decided by middleware.ts. Defaults to the public view. */
export async function getView(): Promise<View> {
  const h = await headers();
  const prepAllowed = h.get("x-audit-prep-allowed") === "1";
  const share = h.get("x-audit-view") !== "prep";
  return { prepAllowed, share };
}
