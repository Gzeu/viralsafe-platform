'use client'

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useCallback, useMemo, useState } from 'react'
import { Address, parseEther, formatEther, TransactionReceipt } from 'viem'
import { toast } from 'react-hot-toast'
import { useWeb3 } from './useWeb3'

// Contract addresses (should be moved to environment variables)
const CONTRACT_ADDRESSES = {
  SAFE_TOKEN: process.env.NEXT_PUBLIC_SAFE_TOKEN_ADDRESS as Address,
  VIRAL_NFT: process.env.NEXT_PUBLIC_VIRAL_NFT_ADDRESS as Address,
  STAKING: process.env.NEXT_PUBLIC_STAKING_ADDRESS as Address,
  MARKETPLACE: process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as Address,
} as const

// ABI definitions (simplified - should be imported from generated types)
const SAFE_TOKEN_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }]
  }
] as const

const VIRAL_NFT_ABI = [
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenUri', type: 'string' }
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'tokenOfOwnerByIndex',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }]
  },
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }]
  }
] as const

interface ContractWriteState {
  isPending: boolean
  isConfirming: boolean
  isConfirmed: boolean
  error: Error | null
  hash?: string
  receipt?: TransactionReceipt
}

/**
 * Hook for reading SAFE token data
 */
export function useSAFEToken(userAddress?: Address) {
  const { data: balance, isLoading: isLoadingBalance, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.SAFE_TOKEN,
    abi: SAFE_TOKEN_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress && !!CONTRACT_ADDRESSES.SAFE_TOKEN,
    }
  })

  const { data: totalSupply, isLoading: isLoadingTotalSupply } = useReadContract({
    address: CONTRACT_ADDRESSES.SAFE_TOKEN,
    abi: SAFE_TOKEN_ABI,
    functionName: 'totalSupply',
    query: {
      enabled: !!CONTRACT_ADDRESSES.SAFE_TOKEN,
    }
  })

  const { data: decimals } = useReadContract({
    address: CONTRACT_ADDRESSES.SAFE_TOKEN,
    abi: SAFE_TOKEN_ABI,
    functionName: 'decimals',
    query: {
      enabled: !!CONTRACT_ADDRESSES.SAFE_TOKEN,
    }
  })

  const formattedBalance = useMemo(() => {
    if (!balance || !decimals) return '0'
    return formatEther(balance)
  }, [balance, decimals])

  const formattedTotalSupply = useMemo(() => {
    if (!totalSupply || !decimals) return '0'
    return formatEther(totalSupply)
  }, [totalSupply, decimals])

  return {
    balance,
    formattedBalance,
    totalSupply,
    formattedTotalSupply,
    decimals,
    isLoadingBalance,
    isLoadingTotalSupply,
    refetchBalance
  }
}

/**
 * Hook for SAFE token operations (transfer, approve)
 */
export function useSAFETokenWrite() {
  const [state, setState] = useState<ContractWriteState>({
    isPending: false,
    isConfirming: false,
    isConfirmed: false,
    error: null
  })

  const { writeContract } = useWriteContract()
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: state.hash as `0x${string}`,
    query: {
      enabled: !!state.hash
    }
  })

  const transfer = useCallback(async (to: Address, amount: string) => {
    if (!CONTRACT_ADDRESSES.SAFE_TOKEN) {
      toast.error('SAFE token contract not configured')
      return
    }

    try {
      setState(prev => ({ ...prev, isPending: true, error: null }))
      
      const hash = await writeContract({
        address: CONTRACT_ADDRESSES.SAFE_TOKEN,
        abi: SAFE_TOKEN_ABI,
        functionName: 'transfer',
        args: [to, parseEther(amount)]
      })

      setState(prev => ({ ...prev, hash, isPending: false, isConfirming: true }))
      toast.success('Transfer initiated! Waiting for confirmation...')
      
    } catch (error) {
      console.error('Transfer error:', error)
      setState(prev => ({ ...prev, error: error as Error, isPending: false }))
      toast.error(error instanceof Error ? error.message : 'Transfer failed')
    }
  }, [writeContract])

  const approve = useCallback(async (spender: Address, amount: string) => {
    if (!CONTRACT_ADDRESSES.SAFE_TOKEN) {
      toast.error('SAFE token contract not configured')
      return
    }

    try {
      setState(prev => ({ ...prev, isPending: true, error: null }))
      
      const hash = await writeContract({
        address: CONTRACT_ADDRESSES.SAFE_TOKEN,
        abi: SAFE_TOKEN_ABI,
        functionName: 'approve',
        args: [spender, parseEther(amount)]
      })

      setState(prev => ({ ...prev, hash, isPending: false, isConfirming: true }))
      toast.success('Approval initiated! Waiting for confirmation...')
      
    } catch (error) {
      console.error('Approval error:', error)
      setState(prev => ({ ...prev, error: error as Error, isPending: false }))
      toast.error(error instanceof Error ? error.message : 'Approval failed')
    }
  }, [writeContract])

  // Update state when transaction is confirmed
  useMemo(() => {
    if (receipt) {
      setState(prev => ({ ...prev, receipt, isConfirming: false, isConfirmed: true }))
      toast.success('Transaction confirmed!')
    }
  }, [receipt])

  return {
    transfer,
    approve,
    ...state,
    isConfirming
  }
}

/**
 * Hook for reading NFT data
 */
export function useViralNFT(userAddress?: Address) {
  const { data: balance, isLoading: isLoadingBalance, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.VIRAL_NFT,
    abi: VIRAL_NFT_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress && !!CONTRACT_ADDRESSES.VIRAL_NFT,
    }
  })

  // Get user's NFT token IDs
  const getUserTokens = useCallback(async (owner: Address) => {
    if (!balance || !CONTRACT_ADDRESSES.VIRAL_NFT) return []
    
    const tokenIds: bigint[] = []
    const balanceNum = Number(balance)
    
    // This is a simplified approach - in production, you might want to use events or a subgraph
    for (let i = 0; i < balanceNum; i++) {
      try {
        // Note: This requires the contract to implement ERC721Enumerable
        // const tokenId = await readContract({
        //   address: CONTRACT_ADDRESSES.VIRAL_NFT,
        //   abi: VIRAL_NFT_ABI,
        //   functionName: 'tokenOfOwnerByIndex',
        //   args: [owner, BigInt(i)]
        // })
        // tokenIds.push(tokenId)
      } catch (error) {
        console.error(`Error getting token ${i}:`, error)
      }
    }
    
    return tokenIds
  }, [balance])

  return {
    balance: balance ? Number(balance) : 0,
    isLoadingBalance,
    refetchBalance,
    getUserTokens
  }
}

/**
 * Hook for NFT minting operations
 */
export function useViralNFTWrite() {
  const [state, setState] = useState<ContractWriteState>({
    isPending: false,
    isConfirming: false,
    isConfirmed: false,
    error: null
  })

  const { writeContract } = useWriteContract()
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: state.hash as `0x${string}`,
    query: {
      enabled: !!state.hash
    }
  })

  const mint = useCallback(async (to: Address, tokenUri: string, mintPrice?: string) => {
    if (!CONTRACT_ADDRESSES.VIRAL_NFT) {
      toast.error('Viral NFT contract not configured')
      return
    }

    try {
      setState(prev => ({ ...prev, isPending: true, error: null }))
      
      const hash = await writeContract({
        address: CONTRACT_ADDRESSES.VIRAL_NFT,
        abi: VIRAL_NFT_ABI,
        functionName: 'mint',
        args: [to, tokenUri],
        value: mintPrice ? parseEther(mintPrice) : undefined
      })

      setState(prev => ({ ...prev, hash, isPending: false, isConfirming: true }))
      toast.success('NFT mint initiated! Waiting for confirmation...')
      
    } catch (error) {
      console.error('Mint error:', error)
      setState(prev => ({ ...prev, error: error as Error, isPending: false }))
      toast.error(error instanceof Error ? error.message : 'Mint failed')
    }
  }, [writeContract])

  // Update state when transaction is confirmed
  useMemo(() => {
    if (receipt) {
      setState(prev => ({ ...prev, receipt, isConfirming: false, isConfirmed: true }))
      toast.success('NFT minted successfully!')
    }
  }, [receipt])

  return {
    mint,
    ...state,
    isConfirming
  }
}

/**
 * Hook for getting allowance data
 */
export function useTokenAllowance(owner?: Address, spender?: Address) {
  const { data: allowance, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.SAFE_TOKEN,
    abi: SAFE_TOKEN_ABI,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    query: {
      enabled: !!owner && !!spender && !!CONTRACT_ADDRESSES.SAFE_TOKEN,
    }
  })

  const formattedAllowance = useMemo(() => {
    if (!allowance) return '0'
    return formatEther(allowance)
  }, [allowance])

  const hasAllowance = useCallback((requiredAmount: string) => {
    if (!allowance) return false
    try {
      return allowance >= parseEther(requiredAmount)
    } catch {
      return false
    }
  }, [allowance])

  return {
    allowance,
    formattedAllowance,
    hasAllowance,
    isLoading,
    refetch
  }
}

/**
 * Utility hook for contract addresses
 */
export function useContractAddresses() {
  return useMemo(() => CONTRACT_ADDRESSES, [])
}