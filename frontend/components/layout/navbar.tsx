'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Menu, 
  X, 
  Home, 
  TrendingUp, 
  Wallet, 
  User, 
  Settings, 
  LogOut,
  Bell,
  Search,
  Plus,
  Moon,
  Sun,
  Globe
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { config } from '@/lib/config'
import { LoadingSpinner, InlineSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'react-hot-toast'

interface NavbarProps {
  user?: {
    id: string
    username: string
    avatar?: string
    safeBalance?: string
    isConnected?: boolean
  }
  notifications?: number
  onConnectWallet?: () => Promise<void>
  onDisconnectWallet?: () => Promise<void>
  onLogout?: () => Promise<void>
}

const navigationItems = [
  { name: 'Feed', href: '/feed', icon: Home },
  { name: 'Trending', href: '/trending', icon: TrendingUp },
  { name: 'NFT Market', href: '/marketplace', icon: Wallet },
  { name: 'Staking', href: '/staking', icon: TrendingUp },
]

export function Navbar({ 
  user, 
  notifications = 0, 
  onConnectWallet,
  onDisconnectWallet,
  onLogout 
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleConnectWallet = async () => {
    if (!onConnectWallet) return
    
    setIsConnecting(true)
    try {
      await onConnectWallet()
      toast.success('Wallet conectat cu succes!')
    } catch (error) {
      console.error('Wallet connection failed:', error)
      toast.error('Nu s-a putut conecta wallet-ul')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnectWallet = async () => {
    if (!onDisconnectWallet) return
    
    try {
      await onDisconnectWallet()
      toast.success('Wallet deconectat')
    } catch (error) {
      console.error('Wallet disconnect failed:', error)
      toast.error('Eroare în deconectarea wallet-ului')
    }
  }

  const handleLogout = async () => {
    if (!onLogout) return
    
    try {
      await onLogout()
      toast.success('Te-ai delogat cu succes')
    } catch (error) {
      console.error('Logout failed:', error)
      toast.error('Eroare în delogare')
    }
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">VS</span>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              ViralSafe
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                    isActive 
                      ? 'bg-accent text-accent-foreground' 
                      : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Search Button */}
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              <Search className="h-4 w-4" />
            </Button>

            {/* Create Post Button */}
            <Button asChild size="sm">
              <Link href="/create">
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Link>
            </Button>

            {/* Theme Toggle */}
            {mounted && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* Notifications */}
            {user && (
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                {notifications > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {notifications > 99 ? '99+' : notifications}
                  </Badge>
                )}
              </Button>
            )}

            {/* User Menu or Connect Wallet */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar || ''} alt={user.username} />
                      <AvatarFallback>
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        @{user.username}
                      </p>
                      {user.safeBalance && (
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.safeBalance} SAFE
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${user.id}`}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {user.isConnected ? (
                    <DropdownMenuItem onClick={handleDisconnectWallet}>
                      <Wallet className="mr-2 h-4 w-4" />
                      <span>Disconnect Wallet</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={handleConnectWallet}>
                      <Wallet className="mr-2 h-4 w-4" />
                      <span>Connect Wallet</span>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  size="sm"
                >
                  {isConnecting ? (
                    <>
                      <InlineSpinner className="mr-2" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      Connect Wallet
                    </>
                  )}
                </Button>
                
                <Button asChild variant="outline" size="sm">
                  <Link href="/auth/login">Login</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t bg-background"
          >
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                        isActive 
                          ? 'bg-accent text-accent-foreground' 
                          : 'text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
                
                {/* Mobile Search */}
                <Button 
                  variant="ghost" 
                  className="justify-start px-3 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Search className="h-4 w-4 mr-3" />
                  Search
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      {isConnecting && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
          <LoadingSpinner text="Connecting wallet..." />
        </div>
      )}
    </nav>
  )
}