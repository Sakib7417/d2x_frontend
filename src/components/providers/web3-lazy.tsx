'use client'

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'

// Lazy-load heavy web3 provider (wagmi/reown) only on client side.
// This keeps the initial bundle small and avoids compiling web3 deps
// for pages that don't use wallet functionality.
const Web3Provider = dynamic(
  () => import('./web3-provider').then((m) => m.Web3Provider),
  {
    ssr: false,
    loading: () => null,
  }
)

export function Web3Lazy({ children }: { children: ReactNode }) {
  return <Web3Provider>{children}</Web3Provider>
}
