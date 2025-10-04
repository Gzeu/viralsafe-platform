'use client'

import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { bsc, bscTestnet, mainnet, polygon, arbitrum } from 'wagmi/chains'
import { cookieStorage, createStorage } from 'wagmi'

// Environment variables
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID as string
export const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY as string

if (!projectId) {
  console.warn('⚠️ WalletConnect Project ID missing. Please add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID to .env.local')
}

// App metadata
export const metadata = {
  name: 'ViralSafe Platform',
  description: 'Transformă viralitatea în active digitale prin Web3 și NFT',
  url: 'https://viralsafe.io',
  icons: ['https://viralsafe.io/icon.png'],
  verifyUrl: 'https://verify.walletconnect.com'
}

// Chain configuration based on environment
const isDevelopment = process.env.NODE_ENV === 'development'
const isTestnet = process.env.NEXT_PUBLIC_NETWORK === 'testnet'

// Primary chains for the application
export const primaryChains = isDevelopment || isTestnet 
  ? [bscTestnet, bsc] 
  : [bsc, bscTestnet] as const

// Extended chains for future expansion
export const extendedChains = [
  ...primaryChains,
  mainnet,
  polygon,
  arbitrum
] as const

// RPC URLs configuration
const rpcUrls = {
  [bsc.id]: [
    `https://bnb-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
    'https://bsc-dataseed1.binance.org',
    'https://bsc-dataseed2.binance.org'
  ],
  [bscTestnet.id]: [
    `https://bnb-testnet.g.alchemy.com/v2/${alchemyApiKey}`,
    'https://data-seed-prebsc-1-s1.binance.org:8545',
    'https://data-seed-prebsc-2-s1.binance.org:8545'
  ]
}

// Enhanced chain configuration
const enhancedChains = primaryChains.map(chain => ({
  ...chain,
  rpcUrls: {
    ...chain.rpcUrls,
    default: { 
      http: rpcUrls[chain.id as keyof typeof rpcUrls] || chain.rpcUrls.default.http 
    }
  }
}))

// Wagmi configuration
export const wagmiConfig = defaultWagmiConfig({
  chains: enhancedChains,
  projectId,
  metadata,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage
  }),
  auth: {
    email: true,
    socials: ['google', 'github', 'discord', 'x'],
    showWallets: true,
    walletFeatures: true
  },
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true
})

// Featured wallet IDs for better UX
const FEATURED_WALLET_IDS = [
  // MetaMask
  'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
  // Trust Wallet
  '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0',
  // Binance Wallet
  '8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4',
  // Coinbase Wallet
  'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa',
  // WalletConnect
  'walletConnect'
] as const

// Include wallet IDs for the modal
const INCLUDE_WALLET_IDS = [
  ...FEATURED_WALLET_IDS,
  // SafePal
  '0b415a746fb9ee99cce155c2ceca0c6f6061b1dbca2d722b3ba16381d0562150',
  // TokenPocket
  '20459438007b75f4f4acb98bf29aa3b800550309646d375da5fd4aac6c2a2c66',
  // MathWallet
  'ca86f48760bf5f84dcd6b1daca0fd55e2dd553ae9bc0f7b89b5370029c2b7fb4'
] as const

// Web3Modal configuration
export const web3ModalConfig = {
  wagmiConfig,
  projectId,
  enableAnalytics: true,
  enableOnramp: true,
  
  // Theme configuration
  themeMode: 'dark' as const,
  themeVariables: {
    '--w3m-color-mix': '#9333ea',
    '--w3m-color-mix-strength': 20,
    '--w3m-font-family': '"Inter", sans-serif',
    '--w3m-border-radius-master': '12px',
    '--w3m-font-size-master': '16px'
  },
  
  // Wallet configuration
  featuredWalletIds: FEATURED_WALLET_IDS,
  includeWalletIds: INCLUDE_WALLET_IDS,
  excludeWalletIds: [
    // Exclude less popular wallets for cleaner UX
    'c286eebc742a26f0571dbb88c5b7bb8189b5f6a4a9b9c4c0c1f4b0d1b5b5b5b5'
  ],
  
  // Features
  enableSwaps: false, // Disable swaps for now
  enableEmail: true,
  enableSocials: true,
  
  // Custom wallet images and names
  walletImages: {
    [FEATURED_WALLET_IDS[0]]: 'https://app.web3modal.com/images/wallets/metamask.png',
    [FEATURED_WALLET_IDS[1]]: 'https://app.web3modal.com/images/wallets/trust.png',
    [FEATURED_WALLET_IDS[2]]: 'https://app.web3modal.com/images/wallets/binance.png'
  }
}

// Chain utilities
export const getChainById = (chainId: number) => {
  return extendedChains.find(chain => chain.id === chainId)
}

export const isTestnetChain = (chainId: number) => {
  return chainId === bscTestnet.id
}

export const isMainnetChain = (chainId: number) => {
  return chainId === bsc.id
}

export const isSupportedChain = (chainId: number) => {
  return primaryChains.some(chain => chain.id === chainId)
}

// Default chain configuration
export const DEFAULT_CHAIN = isDevelopment || isTestnet ? bscTestnet : bsc
export const FALLBACK_CHAIN = bscTestnet

// Contract addresses per chain
export const CONTRACT_ADDRESSES = {
  [bsc.id]: {
    SAFE_TOKEN: process.env.NEXT_PUBLIC_SAFE_TOKEN_MAINNET as `0x${string}`,
    VIRAL_NFT: process.env.NEXT_PUBLIC_VIRAL_NFT_MAINNET as `0x${string}`,
    STAKING: process.env.NEXT_PUBLIC_STAKING_MAINNET as `0x${string}`,
    MARKETPLACE: process.env.NEXT_PUBLIC_MARKETPLACE_MAINNET as `0x${string}`,
  },
  [bscTestnet.id]: {
    SAFE_TOKEN: process.env.NEXT_PUBLIC_SAFE_TOKEN_TESTNET as `0x${string}`,
    VIRAL_NFT: process.env.NEXT_PUBLIC_VIRAL_NFT_TESTNET as `0x${string}`,
    STAKING: process.env.NEXT_PUBLIC_STAKING_TESTNET as `0x${string}`,
    MARKETPLACE: process.env.NEXT_PUBLIC_MARKETPLACE_TESTNET as `0x${string}`,
  }
} as const

// Initialize Web3Modal (client-side only)
export const initializeWeb3Modal = () => {
  if (typeof window !== 'undefined' && projectId) {
    try {
      return createWeb3Modal(web3ModalConfig)
    } catch (error) {
      console.error('Failed to initialize Web3Modal:', error)
      return null
    }
  }
  return null
}

// Export types
export type SupportedChainId = typeof primaryChains[number]['id']
export type ExtendedChainId = typeof extendedChains[number]['id']
export type ContractAddresses = typeof CONTRACT_ADDRESSES[SupportedChainId]