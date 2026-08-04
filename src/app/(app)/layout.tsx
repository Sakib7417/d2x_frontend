import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";

/**
 * Shell for the authenticated user area.
 *
 * A route group so the paths stay `/dashboard`, `/wallet`, … exactly as
 * `PROTECTED_PREFIXES` in `config/routes.ts` expects — renaming this folder
 * to a real segment would silently un-protect every page inside it.
 *
 * Access control is not repeated here: `middleware.ts` already redirects
 * signed-out visitors before this layout renders, and the backend is the real
 * authority on every request.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell navigation="user">{children}</AppShell>;
}
