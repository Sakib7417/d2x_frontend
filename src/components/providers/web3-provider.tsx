'use client'

import { useEffect } from 'react'
import { createAppKit } from '@reown/appkit/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { wagmiAdapter, projectId, networks } from '@/config/wagmi'

const queryClient = new QueryClient()

export function Web3Provider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Create modal only on client side
    createAppKit({
      adapters: [wagmiAdapter],
      projectId,
      networks,
      metadata: {
        name: 'DOLLAR2X',
        description: 'Automated USDT trading platform',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://dollar2x.com',
        icons: ['https://avatars.githubusercontent.com/u/37784886']
      },
      features: {
        analytics: true
      }
    })
  }, [])

  // Always provide Wagmi context
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}