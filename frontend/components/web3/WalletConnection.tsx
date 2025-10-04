'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useWeb3, useChainInfo } from '@/lib/hooks/useWeb3'
import { useSAFEToken } from '@/lib/hooks/useContracts'
import { 
  Wallet, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  Zap,
  TrendingUp,
  DollarSign
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import confetti from 'canvas-confetti'

interface WalletConnectionProps {
  className?: string
  showBalance?: boolean
  showTokens?: boolean
  compact?: boolean
}

export function WalletConnection({ 
  className, 
  showBalance = true, 
  showTokens = true, 
  compact = false 
}: WalletConnectionProps) {
  const {
    isConnected,
    address,
    isConnecting,
    isReconnecting,
    balance,
    formattedBalance,
    isLoadingBalance,
    isCorrectNetwork,
    connectionError,
    connect,
    disconnect,
    copyAddress,
    refreshBalance,
    switchToCorrectNetwork
  } = useWeb3()

  const { name: chainName, isTestnet, explorerUrl } = useChainInfo()
  const { formattedBalance: safeBalance, isLoadingBalance: isLoadingSafeBalance } = useSAFEToken(address)

  const [showFullAddress, setShowFullAddress] = useState(false)
  const [justConnected, setJustConnected] = useState(false)

  // Celebration effect on first connection
  useEffect(() => {
    if (isConnected && !isReconnecting && !justConnected) {
      setJustConnected(true)
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#9333ea', '#3b82f6', '#10b981']
      })
      
      setTimeout(() => setJustConnected(false), 3000)
    }
  }, [isConnected, isReconnecting, justConnected])

  // Format address display
  const displayAddress = address 
    ? showFullAddress 
      ? address 
      : `${address.slice(0, 6)}...${address.slice(-4)}`
    : ''

  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('w-full max-w-md mx-auto', className)}
      >
        <Card className="border-2 border-dashed border-muted-foreground/25 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="text-center pb-4">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="mx-auto w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4"
            >
              <Wallet className="w-6 h-6 text-white" />
            </motion.div>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Connect Your Wallet
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Connect your wallet to start earning SAFE tokens and minting viral content as NFTs
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {connectionError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{connectionError}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              onClick={connect}
              disabled={isConnecting}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-5 w-5" />
                  Connect Wallet
                </>
              )}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>Supported wallets: MetaMask, Trust Wallet, WalletConnect</p>
              <p className="mt-1">We support BNB Chain & BNB Testnet</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn('flex items-center gap-2', className)}
      >
        <Badge 
          variant={isCorrectNetwork ? "default" : "destructive"}
          className="flex items-center gap-1"
        >
          <div className={cn(
            "w-2 h-2 rounded-full",
            isCorrectNetwork ? "bg-green-500 animate-pulse" : "bg-red-500"
          )} />
          {chainName}
        </Badge>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFullAddress(!showFullAddress)}
          className="font-mono text-xs"
        >
          {displayAddress}
        </Button>
        
        {showBalance && (
          <Badge variant="secondary" className="font-mono">
            {isLoadingBalance ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              `${formattedBalance} BNB`
            )}
          </Badge>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('w-full max-w-md mx-auto', className)}
    >
      <Card className={cn(
        "relative overflow-hidden",
        isCorrectNetwork 
          ? "border-green-500/50 bg-gradient-to-br from-green-50/50 to-background" 
          : "border-red-500/50 bg-gradient-to-br from-red-50/50 to-background"
      )}>
        {/* Success animation overlay */}
        <AnimatePresence>
          {justConnected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 z-10 pointer-events-none"
            >
              <motion.div
                animate={{ scale: [0, 1.2, 0] }}
                transition={{ duration: 1.5 }}
                className="absolute inset-0 bg-green-400/20 rounded-lg"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-3 h-3 rounded-full animate-pulse",
                isCorrectNetwork ? "bg-green-500" : "bg-red-500"
              )} />
              <CardTitle className="text-lg font-semibold">Wallet Connected</CardTitle>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={disconnect}
              className="text-muted-foreground hover:text-destructive"
            >
              Disconnect
            </Button>
          </div>
          
          {!isCorrectNetwork && (
            <Alert variant="destructive" className="mt-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Wrong network detected</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={switchToCorrectNetwork}
                  className="ml-2"
                >
                  Switch Network
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Address Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Address</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyAddress}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                {explorerUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`${explorerUrl}/address/${address}`, '_blank')}
                    className="h-6 w-6 p-0"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            
            <Button
              variant="outline"
              className="w-full justify-start font-mono text-sm"
              onClick={() => setShowFullAddress(!showFullAddress)}
            >
              {displayAddress}
            </Button>
          </div>

          {/* Network Info */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-muted-foreground">Network</span>
            <Badge variant={isCorrectNetwork ? "default" : "destructive"}>
              {chainName} {isTestnet && "(Testnet)"}
            </Badge>
          </div>

          <Separator />

          {/* Balance Section */}
          {showBalance && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Native Balance</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshBalance}
                  className="h-6 w-6 p-0"
                  disabled={isLoadingBalance}
                >
                  <RefreshCw className={cn(
                    "h-3 w-3",
                    isLoadingBalance && "animate-spin"
                  )} />
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">BNB</span>
                </div>
                
                {isLoadingBalance ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  <span className="font-mono text-sm font-semibold">
                    {formattedBalance}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* SAFE Token Balance */}
          {showTokens && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">SAFE Tokens</span>
                </div>
                
                {isLoadingSafeBalance ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  <span className="font-mono text-sm font-semibold text-purple-600">
                    {parseFloat(safeBalance).toLocaleString()} SAFE
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => toast.success('Coming soon!')}
            >
              <TrendingUp className="h-4 w-4" />
              Stake
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => toast.success('Coming soon!')}
            >
              <Zap className="h-4 w-4" />
              Earn
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}