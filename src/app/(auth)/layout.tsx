import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck, TrendingUp, Zap } from "lucide-react";

import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ROUTES } from "@/config/routes";

/**
 * Layout for the unauthenticated auth routes.
 *
 * Split screen: form on the left, brand panel on the right.
 *
 * The brand panel is `hidden lg:flex` — below 1024px it disappears entirely
 * rather than stacking above the form. Pushing marketing copy above a login
 * form on mobile is a conversion mistake: the user came to sign in, and every
 * pixel before the email field is friction.
 *
 * Kept as a Server Component; only the theme toggle and the forms are client.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh">
      {/* ---- Form column ---- */}
      <div className="relative flex w-full flex-col lg:w-1/2">
        <header className="flex h-16 shrink-0 items-center justify-between px-6 lg:px-10">
          <Brand href={ROUTES.home} />
          <ThemeToggle />
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-8 lg:px-10">
          {/* max-w-sm keeps the line length comfortable and stops inputs
              stretching to an unusable width on large monitors. */}
          <div className="w-full max-w-sm">{children}</div>
        </main>

        <footer className="text-muted-foreground shrink-0 px-6 py-6 text-xs lg:px-10">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>© {new Date().getFullYear()} DOLLAR2X</span>
            <Link
              href=""
              className="hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <Link
              href=""
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
          </div>
        </footer>
      </div>

      {/* ---- Brand panel ---- */}
      <aside className="bg-surface-1 relative hidden w-1/2 overflow-hidden border-l lg:flex lg:flex-col lg:justify-center">
        {/* Aurora field. `animate-aurora` is a slow transform-only loop, so it
            stays on the compositor and costs no layout work. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="bg-brand-500/25 animate-aurora absolute -top-1/4 -left-1/4 size-152 rounded-full blur-[110px]" />
          <div className="bg-info/15 absolute right-0 bottom-0 size-120 rounded-full blur-[110px]" />
          {/* Hairline grid, masked to fade toward the edges. */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage:
                "radial-gradient(ellipse 70% 60% at 50% 50%, black, transparent)",
              WebkitMaskImage:
                "radial-gradient(ellipse 70% 60% at 50% 50%, black, transparent)",
            }}
          />
        </div>

        <div className="relative z-10 max-w-lg px-14">
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            Built for people who take{" "}
            <span className="text-gradient-brand">compounding</span> seriously.
          </h2>
          <p className="text-muted-foreground mt-4 leading-relaxed text-pretty">
            Automated twice-daily trading sessions, transparent on-chain
            settlement, and a referral structure that rewards real network
            growth.
          </p>

          <ul className="mt-10 space-y-5">
            <Feature
              icon={Zap}
              title="Automated trading sessions"
              description="Morning and evening cycles execute and settle without manual intervention."
            />
            <Feature
              icon={TrendingUp}
              title="Seven-tier rank progression"
              description="Rank and cycle bonuses scale with the depth of your network."
            />
            <Feature
              icon={ShieldCheck}
              title="On-chain settlement"
              description="Every deposit is verified against the chain before a balance moves."
            />
          </ul>
        </div>
      </aside>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Zap;
  title: string;
  description: string;
}) {
  return (
    <li className="flex gap-3.5">
      <span className="border-border/70 bg-surface-2/70 grid size-9 shrink-0 place-items-center rounded-xl border backdrop-blur-sm">
        <Icon className="text-primary size-4.5" strokeWidth={2} />
      </span>
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </li>
  );
}
