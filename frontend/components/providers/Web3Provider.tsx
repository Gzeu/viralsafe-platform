'use client'

import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { WagmiProvider } from 'wagmi'
import { bsc, bscTestnet } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'
import { State } from 'wagmi'

// Get projectId from environment
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID as string

if (!projectId) {
  console.warn('WalletConnect Project ID not found. Please add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID to your .env.local file.')
}

// Create wagmi config with BNB Chain support
const metadata = {
  name: 'ViralSafe Platform',
  description: 'Transformă viralitatea în active digitale prin Web3 și NFT',
  url: 'https://viralsafe.io',
  icons: ['https://viralsafe.io/icon.png']
}

// Configure chains based on environment
const isDevelopment = process.env.NODE_ENV === 'development'
const chains = isDevelopment ? [bscTestnet, bsc] : [bsc, bscTestnet] as const

const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  auth: {
    email: true,
    socials: ['google', 'x', 'github', 'discord'],
    showWallets: true,
    walletFeatures: true
  }
})

// Create modal
if (typeof window !== 'undefined' && projectId) {
  createWeb3Modal({
    wagmiConfig: config,
    projectId,
    enableAnalytics: true,
    enableOnramp: true,
    themeMode: 'dark',
    themeVariables: {
      '--w3m-color-mix': '#9333ea',
      '--w3m-color-mix-strength': 20,
      '--w3m-font-family': 'Inter, sans-serif',
      '--w3m-border-radius-master': '12px',
    },
    featuredWalletIds: [
      // MetaMask
      'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
      // Trust Wallet
      '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0',
      // Binance Wallet
      '8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4',
    ],
    includeWalletIds: [
      // MetaMask
      'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
      // Trust Wallet  
      '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0',
      // Binance Wallet
      '8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4',
      // WalletConnect
      'walletConnect',
    ]
  })
}

interface Web3ProviderProps {
  children: ReactNode
  initialState?: State
}

export function Web3Provider({ children, initialState }: Web3ProviderProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 1_000 * 60 * 60 * 24, // 24 hours
        networkMode: 'offlineFirst',
      },
    },
  }))

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <div className="relative">
          {/* Background gradient animation */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-1/2 -left-1/2 w-full h-full">
              <div className="animate-pulse">
                <div className="w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
              </div>
            </div>
            <div className="absolute -bottom-1/2 -right-1/2 w-full h-full">
              <div className="animate-pulse delay-1000">
                <div className="w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  )
}