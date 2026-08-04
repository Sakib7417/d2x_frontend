import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import { Providers } from "@/components/providers";
import { getSession } from "@/lib/auth/session";
import type { PreloadedState } from "@/store";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DOLLAR2X — USDT Investment & Auto Trading",
    template: "%s · DOLLAR2X",
  },
  description:
    "Institutional-grade USDT investment platform with automated trading sessions, multi-tier referral rewards and transparent on-chain settlement.",
  robots: {
    // The entire authenticated surface must stay out of search indexes; the
    // marketing routes opt back in explicitly via their own metadata.
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  // Matches --background in both themes, so the mobile browser chrome tints
  // to match instead of showing a white bar above a dark app.
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#151319" },
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
  ],
  width: "device-width",
  initialScale: 1,
  // Never block pinch-zoom: users need it to verify a 42-character wallet
  // address, and disabling it is an accessibility failure.
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  /**
   * Resolve the session on the server and hand it to the store as preloaded
   * state. This is what removes the auth flicker: the very first HTML already
   * knows who the user is, so the shell never renders a signed-out header for
   * a frame.
   *
   * Reading cookies opts the whole tree into dynamic rendering — correct here,
   * since every page behind this layout is user-specific anyway.
   */
  const session = await getSession();

  const preloadedState: PreloadedState = {
    auth: session
      ? {
          status: "authenticated",
          // Only the claims the JWT actually carries. The rest of the profile
          // (name, referralCode, rank) is filled in by the first
          // `/users/profile` fetch — inventing placeholders here would mean
          // rendering values that are not real.
          user: {
            id: session.userId,
            email: session.email,
            role: session.role,
            name: null,
            referralCode: "",
            rank: "LV1",
            autoTradeStatus: false,
            status: "ACTIVE",
          },
          expired: false,
        }
      : { status: "unauthenticated", user: null, expired: false },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      {/*
        suppressHydrationWarning is required on <html>: next-themes writes the
        theme class onto this element in a blocking inline script before React
        hydrates, so the server and client markup necessarily differ here. It
        is scoped to this one element and does not mask warnings elsewhere.
      */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-dvh antialiased`}
      >
        <Providers preloadedState={preloadedState}>{children}</Providers>
      </body>
    </html>
  );
}
