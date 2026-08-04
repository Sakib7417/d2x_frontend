import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";

/**
 * Shell for the admin panel.
 *
 * Same `AppShell` as the user area, swapping `USER_NAV` for `ADMIN_NAV` — the
 * two panels share one layout implementation so they cannot drift apart.
 *
 * `constrained={false}`: admin screens are wide operational tables (deposits,
 * withdrawals, audit logs) with many columns, and the 90rem cap that suits the
 * user dashboard forces horizontal scrolling here.
 *
 * Access control is NOT enforced in this layout. `middleware.ts` redirects
 * non-admins away before it renders, and the Express `authorize('ADMIN')`
 * middleware is the actual authority on every request. A client-side role
 * check here would add no security, only the illusion of it.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell navigation="admin" constrained={false}>
      {children}
    </AppShell>
  );
}
