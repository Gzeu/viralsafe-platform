import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format Ethereum address for display
 */
export function formatAddress(address: string | undefined, length = 4): string {
  if (!address) return ''
  return `${address.slice(0, 2 + length)}...${address.slice(-length)}`
}

/**
 * Format number with K, M, B suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(1)}B`
  }
  if (num >= 1e6) {
    return `${(num / 1e6).toFixed(1)}M`
  }
  if (num >= 1e3) {
    return `${(num / 1e3).toFixed(1)}K`
  }
  return num.toString()
}

/**
 * Format token amount with decimals
 */
export function formatTokenAmount(
  amount: string | number | bigint,
  decimals = 18,
  precision = 4
): string {
  const num = typeof amount === 'bigint' ? amount : BigInt(amount)
  const divisor = BigInt(10 ** decimals)
  const quotient = num / divisor
  const remainder = num % divisor
  
  const integerPart = quotient.toString()
  const fractionalPart = remainder.toString().padStart(decimals, '0')
  
  const trimmedFractional = fractionalPart.slice(0, precision).replace(/0+$/, '')
  
  if (trimmedFractional === '') {
    return integerPart
  }
  
  return `${integerPart}.${trimmedFractional}`
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format price in USD
 */
export function formatPrice(price: number, currency = 'USD'): string {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(price)
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

/**
 * Check if address is valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Generate random avatar color based on address
 */
export function getAvatarColor(address: string): string {
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ]
  
  const hash = address.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc)
  }, 0)
  
  return colors[Math.abs(hash) % colors.length]
}

/**
 * Calculate viral score based on engagement
 */
export function calculateViralScore(
  votes: { up: number; down: number },
  engagement: { views: number; shares: number; comments: number },
  timestamp: Date
): number {
  const hoursSincePost = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60)
  const timeDecay = Math.max(0.1, 1 - (hoursSincePost / 168)) // Week decay
  
  const voteScore = (votes.up * 2) - votes.down
  const engagementScore = (engagement.views * 0.1) + (engagement.shares * 5) + (engagement.comments * 3)
  
  return Math.floor((voteScore + engagementScore) * timeDecay)
}

/**
 * Get viral level based on score
 */
export function getViralLevel(score: number): {
  level: 'rising' | 'trending' | 'viral' | 'legendary'
  color: string
  threshold: number
} {
  if (score >= 3000) {
    return { level: 'legendary', color: 'from-yellow-400 to-orange-500', threshold: 3000 }
  }
  if (score >= 2000) {
    return { level: 'viral', color: 'from-red-400 to-pink-500', threshold: 2000 }
  }
  if (score >= 1000) {
    return { level: 'trending', color: 'from-purple-400 to-blue-500', threshold: 1000 }
  }
  return { level: 'rising', color: 'from-green-400 to-teal-500', threshold: 0 }
}

/**
 * Debounce function for search and input
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(null, args), wait)
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    try {
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch (fallbackErr) {
      document.body.removeChild(textArea)
      return false
    }
  }
}

/**
 * Format blockchain transaction hash
 */
export function formatTxHash(hash: string, length = 6): string {
  if (!hash) return ''
  return `${hash.slice(0, length)}...${hash.slice(-length)}`
}

/**
 * Generate IPFS gateway URL
 */
export function getIPFSUrl(hash: string): string {
  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/'
  return `${gateway}${hash}`
}

/**
 * Convert timestamp to relative time
 */
export function getTimeAgo(timestamp: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000)
  
  const intervals = {
    an: 31536000,
    lună: 2592000,
    săptămână: 604800,
    zi: 86400,
    oră: 3600,
    minut: 60,
  }
  
  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds)
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? (unit === 'lună' ? 'i' : unit === 'săptămână' ? 'i' : 'e') : ''} în urmă`
    }
  }
  
  return 'Acum'
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Generate random ID
 */
export function generateId(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Sleep function for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}