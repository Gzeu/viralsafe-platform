'use client'

import Link from 'next/link'
import { useAccount, useDisconnect } from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  User, 
  LogOut, 
  Settings, 
  Wallet,
  TrendingUp,
  Image as ImageIcon,
  Vote,
  Users
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { formatAddress } from '@/lib/utils'

export function Header() {
  const { address, isConnected, chain } = useAccount()
  const { open } = useWeb3Modal()
  const { disconnect } = useDisconnect()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <header className="border-b border-purple-800/30 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                ViralSafe
              </Link>
            </div>
            <div className="w-32 h-10 bg-slate-800 rounded-lg animate-pulse" />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="border-b border-purple-800/30 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent hover:scale-105 transition-transform"
            >
              ViralSafe
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                href="/feed" 
                className="flex items-center space-x-2 text-gray-300 hover:text-purple-400 transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Feed</span>
              </Link>
              
              <Link 
                href="/marketplace" 
                className="flex items-center space-x-2 text-gray-300 hover:text-purple-400 transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Marketplace</span>
              </Link>
              
              <Link 
                href="/governance" 
                className="flex items-center space-x-2 text-gray-300 hover:text-purple-400 transition-colors"
              >
                <Vote className="w-4 h-4" />
                <span>DAO</span>
              </Link>
              
              <Link 
                href="/creators" 
                className="flex items-center space-x-2 text-gray-300 hover:text-purple-400 transition-colors"
              >
                <Users className="w-4 h-4" />
                <span>Creators</span>
              </Link>
            </nav>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {/* Chain indicator */}
            {isConnected && chain && (
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-slate-800 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  chain.id === 56 ? 'bg-yellow-400' : 
                  chain.id === 97 ? 'bg-orange-400' : 'bg-red-400'
                }`} />
                <span className="text-xs text-gray-300">
                  {chain.name}
                </span>
              </div>
            )}
            
            {!isConnected ? (
              <Button
                onClick={() => open()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center space-x-2 hover:bg-slate-800 rounded-lg px-3 py-2"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={`https://avatar.vercel.sh/${address}`} />
                      <AvatarFallback className="bg-purple-600 text-white">
                        {address?.slice(2, 4).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium text-gray-200">
                        {formatAddress(address)}
                      </div>
                      <div className="text-xs text-gray-400">
                        Connected
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent 
                  className="w-56 bg-slate-800 border-slate-700" 
                  align="end"
                >
                  <DropdownMenuLabel className="text-gray-200">
                    My Account
                  </DropdownMenuLabel>
                  
                  <DropdownMenuSeparator className="bg-slate-700" />
                  
                  <DropdownMenuItem className="text-gray-300 hover:bg-slate-700 hover:text-white">
                    <User className="mr-2 h-4 w-4" />
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem className="text-gray-300 hover:bg-slate-700 hover:text-white">
                    <Wallet className="mr-2 h-4 w-4" />
                    <button onClick={() => open()}>Manage Wallet</button>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem className="text-gray-300 hover:bg-slate-700 hover:text-white">
                    <Settings className="mr-2 h-4 w-4" />
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-slate-700" />
                  
                  <DropdownMenuItem 
                    className="text-red-400 hover:bg-red-900/20 hover:text-red-300"
                    onClick={() => disconnect()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}