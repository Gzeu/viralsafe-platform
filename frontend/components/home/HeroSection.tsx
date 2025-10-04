'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, Play, Zap, TrendingUp } from 'lucide-react'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { motion } from 'framer-motion'

export function HeroSection() {
  const { open } = useWeb3Modal()
  const { isConnected } = useAccount()

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -120, 0],
            y: [0, 80, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
        />
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        {/* Badge */}
        <motion.div 
          className="inline-flex items-center space-x-2 bg-purple-900/50 border border-purple-500/30 rounded-full px-4 py-2 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Zap className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-purple-200 font-medium">
            Primul platform Web3 pentru conținut viral din România
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1 
          className="text-5xl lg:text-7xl font-bold mb-6 leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
            Transformă
          </span>
          <br />
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
            Viralitatea
          </span>
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
            în NFT
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          className="text-xl lg:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Platforma Web3 care combină elementele sociale cu monetizarea blockchain.
          <br />
          <span className="text-purple-300">
            Câștigă din conținutul tău viral prin SAFE tokens și NFT-uri.
          </span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {!isConnected ? (
            <Button
              onClick={() => open()}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-purple-500/25"
            >
              <Wallet className="w-5 h-5 mr-2" />
              Conectează Wallet-ul
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-purple-500/25"
            >
              <Link href="/feed">
                <TrendingUp className="w-5 h-5 mr-2" />
                Explorează Feed-ul
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          )}
          
          <Button
            variant="outline"
            size="lg"
            className="border-purple-500/50 text-purple-200 hover:bg-purple-500/10 px-8 py-4 rounded-xl text-lg transition-all duration-300 hover:scale-105 backdrop-blur-sm"
          >
            <Play className="w-5 h-5 mr-2" />
            Vezi Demo
          </Button>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">1B</div>
            <div className="text-gray-400">SAFE Tokens</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-pink-400 mb-2">5%</div>
            <div className="text-gray-400">Royalties NFT</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">2.5%</div>
            <div className="text-gray-400">Marketplace Fee</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">∞</div>
            <div className="text-gray-400">Potential Viral</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}