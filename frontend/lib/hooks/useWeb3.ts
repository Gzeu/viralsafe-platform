'use client'

import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useSwitchChain } from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { formatEther, parseEther } from 'viem'
import { bsc, bscTestnet } from 'wagmi/chains'
import { toast } from 'react-hot-toast'
import { useLocalStorage } from 'react-use'

export interface Web3State {
  // Account state
  isConnected: boolean
  address?: string
  chainId?: number
  isConnecting: boolean
  isReconnecting: boolean
  
  // Balance state
  balance?: string
  formattedBalance?: string
  isLoadingBalance: boolean
  
  // Network state
  isCorrectNetwork: boolean
  supportedChainIds: number[]
  currentChain?: typeof bsc | typeof bscTestnet
  
  // Connection state
  lastConnectedWallet?: string
  connectionError?: string
}

export interface Web3Actions {
  // Connection actions
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  reconnect: () => Promise<void>
  
  // Network actions
  switchToCorrectNetwork: () => Promise<void>
  switchToTestnet: () => Promise<void>
  switchToMainnet: () => Promise<void>
  
  // Utility actions
  openModal: () => void
  closeModal: () => void
  copyAddress: () => Promise<void>
  refreshBalance: () => void
}

const SUPPORTED_CHAINS = [bsc.id, bscTestnet.id] as const
const DEFAULT_CHAIN = process.env.NODE_ENV === 'development' ? bscTestnet.id : bsc.id

/**
 * Advanced Web3 hook providing comprehensive wallet management
 * @returns {Web3State & Web3Actions} Web3 state and actions
 */
export function useWeb3(): Web3State & Web3Actions {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount()
  const { connect: wagmiConnect, connectors } = useConnect()
  const { disconnect: wagmiDisconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const chainId = useChainId()
  const { open, close } = useWeb3Modal()
  
  const [connectionError, setConnectionError] = useState<string>()
  const [lastConnectedWallet, setLastConnectedWallet] = useLocalStorage('viralsafe-last-wallet')
  
  // Balance query
  const { 
    data: balance, 
    isLoading: isLoadingBalance, 
    refetch: refetchBalance 
  } = useBalance({ 
    address, 
    chainId,
    query: {
      enabled: !!address && isConnected,
      refetchInterval: 30000 // Refresh every 30 seconds
    }
  })

  // Computed state
  const formattedBalance = useMemo(() => {
    if (!balance) return undefined
    const formatted = formatEther(balance.value)
    return parseFloat(formatted).toFixed(4)
  }, [balance])

  const isCorrectNetwork = useMemo(() => {
    return chainId ? SUPPORTED_CHAINS.includes(chainId) : false
  }, [chainId])

  const currentChain = useMemo(() => {
    if (chainId === bsc.id) return bsc
    if (chainId === bscTestnet.id) return bscTestnet
    return undefined
  }, [chainId])

  const supportedChainIds = useMemo(() => [...SUPPORTED_CHAINS], [])

  // Connection management
  const connect = useCallback(async () => {
    try {
      setConnectionError(undefined)
      open()
    } catch (error) {
      console.error('Connection error:', error)
      setConnectionError(error instanceof Error ? error.message : 'Connection failed')
      toast.error('Failed to connect wallet')
    }
  }, [open])

  const disconnect = useCallback(async () => {
    try {
      await wagmiDisconnect()
      setLastConnectedWallet(undefined)
      setConnectionError(undefined)
      toast.success('Wallet disconnected')
    } catch (error) {
      console.error('Disconnect error:', error)
      toast.error('Failed to disconnect wallet')
    }
  }, [wagmiDisconnect, setLastConnectedWallet])

  const reconnect = useCallback(async () => {
    if (lastConnectedWallet) {
      const connector = connectors.find(c => c.name === lastConnectedWallet)
      if (connector) {
        try {
          await wagmiConnect({ connector })
        } catch (error) {
          console.error('Reconnection failed:', error)
          setConnectionError('Failed to reconnect')
        }
      }
    }
  }, [lastConnectedWallet, connectors, wagmiConnect])

  // Network management
  const switchToCorrectNetwork = useCallback(async () => {
    if (!switchChain) {
      toast.error('Network switching not supported')
      return
    }
    
    try {
      await switchChain({ chainId: DEFAULT_CHAIN })
      toast.success(`Switched to ${DEFAULT_CHAIN === bsc.id ? 'BNB Chain' : 'BNB Testnet'}`)
    } catch (error) {
      console.error('Network switch error:', error)
      toast.error('Failed to switch network')
    }
  }, [switchChain])

  const switchToTestnet = useCallback(async () => {
    if (!switchChain) {
      toast.error('Network switching not supported')
      return
    }
    
    try {
      await switchChain({ chainId: bscTestnet.id })
      toast.success('Switched to BNB Testnet')
    } catch (error) {
      console.error('Network switch error:', error)
      toast.error('Failed to switch to testnet')
    }
  }, [switchChain])

  const switchToMainnet = useCallback(async () => {
    if (!switchChain) {
      toast.error('Network switching not supported')
      return
    }
    
    try {
      await switchChain({ chainId: bsc.id })
      toast.success('Switched to BNB Chain')
    } catch (error) {
      console.error('Network switch error:', error)
      toast.error('Failed to switch to mainnet')
    }
  }, [switchChain])

  // Utility functions
  const copyAddress = useCallback(async () => {
    if (!address) {
      toast.error('No address to copy')
      return
    }
    
    try {
      await navigator.clipboard.writeText(address)
      toast.success('Address copied to clipboard!')
    } catch (error) {
      console.error('Copy failed:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = address
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      toast.success('Address copied to clipboard!')
    }
  }, [address])

  const refreshBalance = useCallback(() => {
    if (address && isConnected) {
      refetchBalance()
      toast.success('Balance refreshed')
    }
  }, [address, isConnected, refetchBalance])

  const openModal = useCallback(() => {
    open()
  }, [open])

  const closeModal = useCallback(() => {
    close()
  }, [close])

  // Auto-reconnect on page load
  useEffect(() => {
    if (!isConnected && lastConnectedWallet && !isConnecting) {
      reconnect()
    }
  }, [isConnected, lastConnectedWallet, isConnecting, reconnect])

  // Save last connected wallet
  useEffect(() => {
    if (isConnected && address) {
      // Get the current connector name (this might need adjustment based on wagmi v2 API)
      const currentConnector = connectors.find(c => c.type === 'injected') // Simplified
      if (currentConnector) {
        setLastConnectedWallet(currentConnector.name)
      }
    }
  }, [isConnected, address, connectors, setLastConnectedWallet])

  // Network warning
  useEffect(() => {
    if (isConnected && !isCorrectNetwork && chainId) {
      toast.error(
        `Unsupported network detected. Please switch to ${DEFAULT_CHAIN === bsc.id ? 'BNB Chain' : 'BNB Testnet'}`,
        {
          duration: 5000,
          id: 'network-warning'
        }
      )
    }
  }, [isConnected, isCorrectNetwork, chainId])

  // Connection success notification
  useEffect(() => {
    if (isConnected && address && !isReconnecting) {
      toast.success(`Connected to ${address.slice(0, 6)}...${address.slice(-4)}`, {
        id: 'wallet-connected'
      })
    }
  }, [isConnected, address, isReconnecting])

  return {
    // State
    isConnected,
    address,
    chainId,
    isConnecting,
    isReconnecting,
    balance: balance?.formatted,
    formattedBalance,
    isLoadingBalance,
    isCorrectNetwork,
    supportedChainIds,
    currentChain,
    lastConnectedWallet,
    connectionError,
    
    // Actions
    connect,
    disconnect,
    reconnect,
    switchToCorrectNetwork,
    switchToTestnet,
    switchToMainnet,
    openModal,
    closeModal,
    copyAddress,
    refreshBalance
  }
}

/**
 * Hook for checking if user has sufficient balance for transactions
 * @param requiredAmount - Required amount in ETH
 * @returns {boolean} Whether user has sufficient balance
 */
export function useHasSufficientBalance(requiredAmount: string): boolean {
  const { balance, isConnected } = useWeb3()
  
  return useMemo(() => {
    if (!isConnected || !balance) return false
    
    try {
      const required = parseEther(requiredAmount)
      const current = parseEther(balance)
      return current >= required
    } catch {
      return false
    }
  }, [balance, isConnected, requiredAmount])
}

/**
 * Hook for getting formatted chain information
 * @returns Chain display information
 */
export function useChainInfo() {
  const { currentChain, chainId } = useWeb3()
  
  return useMemo(() => {
    if (!currentChain || !chainId) {
      return {
        name: 'Unknown',
        isTestnet: false,
        explorerUrl: '',
        symbol: 'ETH',
        rpcUrl: ''
      }
    }
    
    return {
      name: currentChain.name,
      isTestnet: chainId === bscTestnet.id,
      explorerUrl: currentChain.blockExplorers?.default.url || '',
      symbol: currentChain.nativeCurrency.symbol,
      rpcUrl: currentChain.rpcUrls.default.http[0] || ''
    }
  }, [currentChain, chainId])
}