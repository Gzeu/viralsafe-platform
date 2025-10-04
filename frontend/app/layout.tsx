import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Web3Provider } from '@/components/providers/Web3Provider'
import { Toaster } from 'react-hot-toast'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ViralSafe - Transformă viralitatea în NFT',
  description: '🚀 Platforma Web3 care transformă conținutul viral în active digitale valoroase prin NFT și tokenomics.',
  keywords: ['Web3', 'NFT', 'viral', 'blockchain', 'SAFE token', 'creator economy'],
  authors: [{ name: 'ViralSafe Team', url: 'https://github.com/Gzeu' }],
  openGraph: {
    title: 'ViralSafe Platform',
    description: 'Transformă viralitatea în active digitale prin Web3 și NFT',
    url: 'https://viralsafe.io',
    siteName: 'ViralSafe',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ViralSafe Platform',
      },
    ],
    locale: 'ro_RO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ViralSafe Platform',
    description: 'Transformă viralitatea în active digitale prin Web3 și NFT',
    creator: '@ViralSafePlatform',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ro" className="dark">
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900`}>
        <Web3Provider>
          <div className="flex flex-col min-h-screen">
            <Header />
            
            <main className="flex-1 container mx-auto px-4 py-8">
              {children}
            </main>
            
            <Footer />
          </div>
          
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(30, 41, 59, 0.9)',
                color: '#fff',
                border: '1px solid rgba(147, 51, 234, 0.3)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
              },
              success: {
                style: {
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                },
              },
              error: {
                style: {
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                },
              },
            }}
          />
        </Web3Provider>
      </body>
    </html>
  )
}