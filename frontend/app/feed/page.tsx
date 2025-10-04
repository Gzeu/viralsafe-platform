'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { ViralPost } from '@/components/feed/ViralPost'
import { PostCreator } from '@/components/feed/PostCreator'
import { VotingSystem } from '@/components/feed/VotingSystem'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  Clock, 
  Fire, 
  Users,
  Plus,
  RefreshCw,
  Filter
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'

export interface Post {
  id: string
  content: string
  creator: {
    address: string
    username?: string
    avatar?: string
  }
  media?: {
    type: 'image' | 'video' | 'audio'
    url: string
    thumbnail?: string
  }[]
  votes: {
    up: number
    down: number
    total: number
  }
  viralScore: number
  timestamp: Date
  isNFT: boolean
  tags: string[]
  engagement: {
    views: number
    shares: number
    comments: number
  }
}

// Mock data pentru development
const mockPosts: Post[] = [
  {
    id: '1',
    content: 'Primul meu post viral pe ViralSafe! 🚀 Cine crede că acest content merită să devină NFT?',
    creator: {
      address: '0x742...4b2',
      username: 'CryptoCreator',
      avatar: 'https://avatar.vercel.sh/crypto-creator'
    },
    media: [
      {
        type: 'image',
        url: '/demo-content-1.jpg',
        thumbnail: '/demo-content-1-thumb.jpg'
      }
    ],
    votes: { up: 1250, down: 45, total: 1295 },
    viralScore: 2847,
    timestamp: new Date('2024-10-03T18:30:00Z'),
    isNFT: true,
    tags: ['crypto', 'viral', 'nft'],
    engagement: { views: 15420, shares: 342, comments: 89 }
  },
  {
    id: '2', 
    content: 'Tocmai am câștigat 500 SAFE tokens din staking! 💰 Cine altcineva participă la rewards?',
    creator: {
      address: '0x123...abc',
      username: 'SAFEInvestor',
      avatar: 'https://avatar.vercel.sh/safe-investor'
    },
    votes: { up: 892, down: 23, total: 915 },
    viralScore: 1456,
    timestamp: new Date('2024-10-03T16:45:00Z'),
    isNFT: false,
    tags: ['safe', 'staking', 'rewards'],
    engagement: { views: 8930, shares: 156, comments: 45 }
  },
  {
    id: '3',
    content: 'Nou challenge TikTok integrat pe ViralSafe! #ViralSafeChallenge - Cine se alătură?',
    creator: {
      address: '0x456...def',
      username: 'TikTokStar',
      avatar: 'https://avatar.vercel.sh/tiktok-star'
    },
    media: [
      {
        type: 'video',
        url: '/demo-video-1.mp4',
        thumbnail: '/demo-video-1-thumb.jpg'
      }
    ],
    votes: { up: 2341, down: 67, total: 2408 },
    viralScore: 3892,
    timestamp: new Date('2024-10-03T14:20:00Z'),
    isNFT: true,
    tags: ['tiktok', 'challenge', 'viral'],
    engagement: { views: 28750, shares: 892, comments: 234 }
  }
]

export default function FeedPage() {
  const { isConnected } = useAccount()
  const [posts, setPosts] = useState<Post[]>(mockPosts)
  const [activeTab, setActiveTab] = useState('trending')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulare refresh
    await new Promise(resolve => setTimeout(resolve, 1500))
    toast.success('Feed actualizat cu succes!')
    setIsRefreshing(false)
  }

  const handleVote = async (postId: string, voteType: 'up' | 'down', amount: number) => {
    if (!isConnected) {
      toast.error('Conectează-ți wallet-ul pentru a vota!')
      return
    }
    
    // Update local state
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
          const newVotes = { ...post.votes }
          if (voteType === 'up') {
            newVotes.up += amount
          } else {
            newVotes.down += amount
          }
          newVotes.total = newVotes.up + newVotes.down
          
          return {
            ...post,
            votes: newVotes,
            viralScore: post.viralScore + (voteType === 'up' ? amount * 2 : -amount)
          }
        }
        return post
      })
    )
    
    toast.success(`Ai votat cu ${amount} SAFE tokens!`)
  }

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <div className="text-6xl mb-6">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Conecteză-ți Wallet-ul
          </h2>
          <p className="text-gray-400 mb-8">
            Pentru a accesa feed-ul viral și a vota cu SAFE tokens, trebuie să te conectezi.
          </p>
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            Înapoi la Homepage
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Feed Viral
            </h1>
            <p className="text-gray-400">
              Descoperă, votează și câștigă din conținutul viral
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-purple-500/50 hover:bg-purple-500/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Post Nou
            </Button>
          </div>
        </div>

        {/* Tabs pentru sortare */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="trending" className="flex items-center space-x-2">
              <Fire className="w-4 h-4" />
              <span>Trending</span>
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Recent</span>
            </TabsTrigger>
            <TabsTrigger value="top" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Top Rated</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-6">
            {/* Post Creator */}
            <PostCreator className="mb-8" />
            
            {/* Posts Grid */}
            <div className="space-y-6">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <ViralPost 
                    post={post} 
                    onVote={(voteType, amount) => handleVote(post.id, voteType, amount)}
                  />
                </motion.div>
              ))}
            </div>
            
            {/* Load more */}
            <div className="text-center mt-12">
              <Button
                variant="outline"
                className="border-purple-500/50 hover:bg-purple-500/10"
              >
                Încarcă mai multe posturi
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}