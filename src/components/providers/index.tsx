

import type { ReactNode } from "react";
import { headers } from 'next/headers' 
import { StoreProvider } from "./store-provider";
import { ThemeProvider } from "./theme-provider";
import { SessionWatcher } from "./session-watcher";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import type { PreloadedState } from "@/store";
import ContextProvider from '@/context'
import { QueryProvider } from "./web3-provider"
import { Web3Lazy } from "./web3-lazy"

/**
 * Root provider composition.
 *
 * Order matters:
 *   ThemeProvider   outermost, so the theme class is on <html> before anything
 *                   paints and there is no flash of the wrong theme.
 *   StoreProvider   next, because everything below reads Redux.
 *   TooltipProvider a single shared provider — mounting one per tooltip (the
 *                   easy mistake) means each keeps its own delay timer, so
 *                   moving between adjacent icon buttons re-triggers the full
 *                   open delay instead of the intended instant hand-off.
 *   SessionWatcher  inside the store, since it reads and dispatches auth state.
 */
export async function Providers({
  children,
  preloadedState,
}: {
  children: ReactNode;
  preloadedState?: PreloadedState;
}) {
    const headersObj = await headers()
  const cookies = headersObj.get('cookie')
  return (
    <ThemeProvider>
      <QueryProvider>
        <StoreProvider preloadedState={preloadedState}>
          <TooltipProvider delayDuration={250} skipDelayDuration={400}>
            <SessionWatcher />
              <ContextProvider cookies={cookies}>
            <Web3Lazy>
            {children}
            </Web3Lazy>
            </ContextProvider>
            <Toaster />
          </TooltipProvider>
        </StoreProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
