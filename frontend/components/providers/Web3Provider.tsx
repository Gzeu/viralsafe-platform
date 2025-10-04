'use client'

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState, useEffect } from 'react'
import { State } from 'wagmi'
import { Toaster } from 'react-hot-toast'
import { wagmiConfig, initializeWeb3Modal } from '@/lib/web3-config'

interface Web3ProviderProps {
  children: ReactNode
  initialState?: State
}

export function Web3Provider({ children, initialState }: Web3ProviderProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 1_000 * 60 * 60 * 24, // 24 hours
        staleTime: 1_000 * 60 * 5, // 5 minutes
        networkMode: 'offlineFirst',
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if (error && typeof error === 'object' && 'status' in error) {
            const status = error.status as number
            if (status >= 400 && status < 500) return false
          }
          return failureCount < 3
        },
      },
      mutations: {
        networkMode: 'offlineFirst',
        retry: 1,
      },
    },
  }))

  // Initialize Web3Modal on client side
  useEffect(() => {
    const modal = initializeWeb3Modal()
    
    if (!modal) {
      console.warn('⚠️ Web3Modal initialization failed')
    }
    
    // Clean up function
    return () => {
      // Web3Modal cleanup if needed
    }
  }, [])

  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <div className="relative min-h-screen">
          {/* Animated background */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            {/* Primary gradient */}
            <div className="absolute -top-1/2 -left-1/2 w-full h-full opacity-30">
              <div className="animate-pulse duration-[4000ms]">
                <div className="w-96 h-96 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl" />
              </div>
            </div>
            
            {/* Secondary gradient */}
            <div className="absolute -bottom-1/2 -right-1/2 w-full h-full opacity-30">
              <div className="animate-pulse duration-[6000ms] delay-1000">
                <div className="w-96 h-96 bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-full blur-3xl" />
              </div>
            </div>
            
            {/* Accent gradient */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 opacity-20">
              <div className="animate-pulse duration-[8000ms] delay-2000">
                <div className="w-full h-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full blur-2xl" />
              </div>
            </div>
            
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
            
            {/* Radial gradient overlay */}
            <div className="absolute inset-0 bg-gradient-radial from-transparent via-background/50 to-background" />
          </div>
          
          {/* Content */}
          <div className="relative z-10">
            {children}
          </div>
          
          {/* Toast notifications */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '14px',
              },
              success: {
                iconTheme: {
                  primary: 'hsl(var(--primary))',
                  secondary: 'hsl(var(--primary-foreground))',
                },
              },
              error: {
                iconTheme: {
                  primary: 'hsl(var(--destructive))',
                  secondary: 'hsl(var(--destructive-foreground))',
                },
              },
            }}
          />
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

// Connection status component for debugging
export function ConnectionStatus() {
  if (process.env.NODE_ENV !== 'development') return null
  
  return (
    <div className="fixed bottom-4 left-4 z-50 opacity-50 hover:opacity-100 transition-opacity">
      <div className="bg-background/80 backdrop-blur border rounded-lg p-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Web3 Ready</span>
        </div>
      </div>
    </div>
  )
}