/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable app directory
    appDir: true,
    // Server components
    serverComponentsExternalPackages: ['ethers'],
  },

  // Enable image optimization
  images: {
    domains: [
      'localhost',
      'viralsafe.io',
      'gateway.pinata.cloud',
      'ipfs.io',
      'cloudflare-ipfs.com',
      'gateway.ipfs.io',
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  // Enable compression
  compress: true,

  // Generate ETags for better caching
  generateEtags: true,

  // Power by header
  poweredByHeader: false,

  // React strict mode
  reactStrictMode: true,

  // SWC minification
  swcMinify: true,

  // Bundle analyzer (enable with ANALYZE=true)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      const { BundleAnalyzerPlugin } = require('@next/bundle-analyzer')({
        enabled: true,
      })
      config.plugins.push(new BundleAnalyzerPlugin())
      return config
    },
  }),

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Handle ethers.js and crypto polyfills
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      assert: require.resolve('assert'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify'),
      url: require.resolve('url'),
      zlib: require.resolve('browserify-zlib'),
    }

    // Ignore node modules that shouldn't be bundled
    config.externals = [...(config.externals || []), {
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    }]

    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // Common chunk
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
          // Web3 chunk
          web3: {
            name: 'web3',
            chunks: 'all',
            test: /node_modules\/(ethers|@web3modal|wagmi|viem)/,
            priority: 30,
          },
          // UI chunk
          ui: {
            name: 'ui',
            chunks: 'all',
            test: /node_modules\/(framer-motion|@radix-ui|lucide-react)/,
            priority: 25,
          },
        },
      }
    }

    return config
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Redirect configuration
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/feed',
        permanent: true,
      },
      {
        source: '/dashboard',
        destination: '/profile',
        permanent: false,
      },
    ]
  },

  // Rewrites for API proxying (optional)
  async rewrites() {
    return [
      // Proxy API requests in development
      ...(process.env.NODE_ENV === 'development' ? [
        {
          source: '/api/proxy/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/:path*`,
        },
      ] : []),
    ]
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ]
  },

  // Output configuration
  output: 'standalone',

  // Compiler options
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // TypeScript configuration
  typescript: {
    // Ignore TypeScript errors in production build (not recommended)
    // ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },

  // ESLint configuration
  eslint: {
    // Ignore ESLint errors in production build (not recommended)
    // ignoreDuringBuilds: process.env.NODE_ENV === 'production',
    dirs: ['app', 'components', 'lib', 'hooks'],
  },

  // Performance optimizations
  productionBrowserSourceMaps: false,
  optimizeFonts: true,
  optimizeCss: true,

  // Vercel-specific optimizations
  ...(process.env.VERCEL && {
    // Enable ISR for better performance
    experimental: {
      ...nextConfig.experimental,
      isrMemoryCacheSize: 0,
    },
  }),
}

// Development-specific configurations
if (process.env.NODE_ENV === 'development') {
  nextConfig.logging = {
    fetches: {
      fullUrl: true,
    },
  }
}

module.exports = nextConfig