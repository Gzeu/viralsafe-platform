import { type Chain } from 'viem'

// Environment variables with fallbacks
export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
    version: process.env.NEXT_PUBLIC_API_VERSION || 'v1',
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws',
    timeout: 30000, // 30 seconds
    retries: 3,
  },

  // App Configuration
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'ViralSafe',
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Transformă viralitatea în active digitale prin Web3 și NFT',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    domain: process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3000',
  },

  // Web3 Configuration
  web3: {
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
    alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '',
    infuraProjectId: process.env.NEXT_PUBLIC_INFURA_PROJECT_ID || '',
  },

  // Blockchain Configuration
  blockchain: {
    chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '97', 10),
    chainName: process.env.NEXT_PUBLIC_CHAIN_NAME || 'BSC Testnet',
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    blockExplorer: process.env.NEXT_PUBLIC_BLOCK_EXPLORER || 'https://testnet.bscscan.com',
  },

  // Smart Contracts
  contracts: {
    safeToken: process.env.NEXT_PUBLIC_SAFE_TOKEN_ADDRESS || '',
    viralNFT: process.env.NEXT_PUBLIC_VIRAL_NFT_ADDRESS || '',
    staking: process.env.NEXT_PUBLIC_STAKING_ADDRESS || '',
    marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || '',
  },

  // IPFS Configuration
  ipfs: {
    pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',
    gateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/',
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760', 10), // 10MB
    supportedImageTypes: process.env.NEXT_PUBLIC_SUPPORTED_IMAGE_TYPES?.split(',') || 
      ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportedVideoTypes: process.env.NEXT_PUBLIC_SUPPORTED_VIDEO_TYPES?.split(',') || 
      ['video/mp4', 'video/webm', 'video/quicktime'],
  },

  // Feature Flags
  features: {
    enableDevTools: process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === 'true',
    enableStorybook: process.env.NEXT_PUBLIC_ENABLE_STORYBOOK === 'true',
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    enablePWA: process.env.NEXT_PUBLIC_ENABLE_PWA === 'true',
    enableMockData: process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === 'true',
    enableDebugMode: process.env.NEXT_PUBLIC_ENABLE_DEBUG_MODE === 'true',
    showGridOverlay: process.env.NEXT_PUBLIC_SHOW_GRID_OVERLAY === 'true',
  },

  // Theme Configuration
  theme: {
    default: process.env.NEXT_PUBLIC_DEFAULT_THEME || 'dark',
    enableSwitcher: process.env.NEXT_PUBLIC_ENABLE_THEME_SWITCHER === 'true',
  },

  // Localization
  locale: {
    default: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'ro',
    supported: process.env.NEXT_PUBLIC_SUPPORTED_LOCALES?.split(',') || ['ro', 'en'],
  },

  // SEO Configuration
  seo: {
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'ViralSafe Platform',
    description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Platformă Web3 inovatoare care combină elementele sociale cu monetizarea blockchain',
    keywords: process.env.NEXT_PUBLIC_SITE_KEYWORDS?.split(',') || 
      ['web3', 'nft', 'blockchain', 'viral', 'social', 'tiktok', 'creator-economy'],
    author: process.env.NEXT_PUBLIC_SITE_AUTHOR || 'George Pricop',
    twitter: process.env.NEXT_PUBLIC_SITE_TWITTER || '@ViralSafePlatform',
  },

  // Analytics Configuration
  analytics: {
    vercelId: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID || '',
    gaId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '',
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  },

  // Rate Limiting
  rateLimit: {
    api: parseInt(process.env.NEXT_PUBLIC_API_RATE_LIMIT || '60', 10),
    upload: parseInt(process.env.NEXT_PUBLIC_UPLOAD_RATE_LIMIT || '5', 10),
  },

  // Performance Monitoring
  performance: {
    enableMonitoring: process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true',
    sampleRate: parseFloat(process.env.NEXT_PUBLIC_PERFORMANCE_SAMPLE_RATE || '0.1'),
  },
} as const

// BSC Testnet Chain Configuration
export const bscTestnet: Chain = {
  id: config.blockchain.chainId,
  name: config.blockchain.chainName,
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'tBNB',
  },
  rpcUrls: {
    default: {
      http: [config.blockchain.rpcUrl],
    },
    public: {
      http: [config.blockchain.rpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: 'BSCTestnet',
      url: config.blockchain.blockExplorer,
    },
  },
  testnet: true,
}

// BSC Mainnet Chain Configuration
export const bscMainnet: Chain = {
  id: 56,
  name: 'BNB Smart Chain',
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'BNB',
  },
  rpcUrls: {
    default: {
      http: ['https://bsc-dataseed1.binance.org'],
    },
    public: {
      http: ['https://bsc-dataseed1.binance.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BscScan',
      url: 'https://bscscan.com',
    },
  },
}

// API Endpoints
export const endpoints = {
  // Authentication
  auth: {
    login: '/api/v1/auth/login',
    register: '/api/v1/auth/register',
    logout: '/api/v1/auth/logout',
    profile: '/api/v1/auth/profile',
    refresh: '/api/v1/auth/refresh',
    verify: '/api/v1/auth/verify',
  },

  // Users
  users: {
    profile: (id: string) => `/api/v1/users/${id}`,
    update: (id: string) => `/api/v1/users/${id}`,
    follow: (id: string) => `/api/v1/users/${id}/follow`,
    unfollow: (id: string) => `/api/v1/users/${id}/unfollow`,
    followers: (id: string) => `/api/v1/users/${id}/followers`,
    following: (id: string) => `/api/v1/users/${id}/following`,
  },

  // Posts
  posts: {
    create: '/api/v1/posts',
    list: '/api/v1/posts',
    get: (id: string) => `/api/v1/posts/${id}`,
    update: (id: string) => `/api/v1/posts/${id}`,
    delete: (id: string) => `/api/v1/posts/${id}`,
    like: (id: string) => `/api/v1/posts/${id}/like`,
    unlike: (id: string) => `/api/v1/posts/${id}/unlike`,
    vote: (id: string) => `/api/v1/posts/${id}/vote`,
    comments: (id: string) => `/api/v1/posts/${id}/comments`,
  },

  // NFT
  nft: {
    mint: '/api/v1/nft/mint',
    list: '/api/v1/nft',
    get: (id: string) => `/api/v1/nft/${id}`,
    transfer: (id: string) => `/api/v1/nft/${id}/transfer`,
    marketplace: '/api/v1/nft/marketplace',
    metadata: (id: string) => `/api/v1/nft/${id}/metadata`,
  },

  // Staking
  staking: {
    stake: '/api/v1/staking/stake',
    unstake: '/api/v1/staking/unstake',
    rewards: '/api/v1/staking/rewards',
    claim: '/api/v1/staking/claim',
    info: '/api/v1/staking/info',
  },

  // Analytics
  analytics: {
    overview: '/api/v1/analytics/overview',
    posts: '/api/v1/analytics/posts',
    users: '/api/v1/analytics/users',
    tokens: '/api/v1/analytics/tokens',
    revenue: '/api/v1/analytics/revenue',
  },

  // Health & Status
  health: '/health',
  status: '/api/v1/status',
} as const

// Local Storage Keys
export const storageKeys = {
  theme: 'viralsafe-theme',
  locale: 'viralsafe-locale',
  token: 'viralsafe-auth-token',
  user: 'viralsafe-user',
  wallet: 'viralsafe-wallet-connected',
  preferences: 'viralsafe-preferences',
  drafts: 'viralsafe-drafts',
  cache: 'viralsafe-cache',
} as const

// Error Messages
export const errorMessages = {
  network: 'Eroare de rețea. Te rugăm să încerci din nou.',
  unauthorized: 'Nu ai autorizație pentru această acțiune.',
  validation: 'Datele introduse nu sunt valide.',
  server: 'Eroare de server. Te rugăm să încerci mai târziu.',
  wallet: 'Nu s-a putut conecta la wallet. Verifică MetaMask.',
  transaction: 'Tranzacția a eșuat. Verifică balanta și încearcă din nou.',
  upload: 'Fișierul nu a putut fi încărcat. Verifică dimensiunea și formatul.',
  general: 'A apărut o eroare neașteptată.',
} as const

export type Config = typeof config
export type Endpoints = typeof endpoints
export type StorageKeys = typeof storageKeys
export type ErrorMessages = typeof errorMessages