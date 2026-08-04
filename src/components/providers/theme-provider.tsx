"use client";

import type { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Theme provider.
 *
 * Configured for a dark-first product:
 *   - `defaultTheme="dark"` — this is a trading interface; dark is the product
 *     identity, not a preference toggle bolted on afterwards.
 *   - `enableSystem` still honours an explicit OS light preference.
 *   - `value` maps both themes to explicit classes. next-themes defaults to
 *     adding only a `dark` class and leaving light as the bare `:root`; our
 *     token sheet defines light under an explicit `.light` selector so that
 *     both themes are symmetrical and neither depends on cascade order.
 *   - `disableTransitionOnChange` prevents every colour-transitioning element
 *     on the page from animating at once when toggling, which on a dense
 *     dashboard looks like a rendering fault.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      value={{ light: "light", dark: "dark" }}
    >
      {children}
    </NextThemesProvider>
  );
}
