'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  ThumbsUp, 
  ThumbsDown, 
  Share2, 
  MessageCircle,
  Eye,
  Zap,
  Crown,
  ExternalLink,
  Play
} from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { ro } from 'date-fns/locale'
import { Post } from '@/app/feed/page'
import { formatNumber } from '@/lib/utils'
import Image from 'next/image'

interface ViralPostProps {
  post: Post
  onVote: (voteType: 'up' | 'down', amount: number) => void
  className?: string
}

export function ViralPost({ post, onVote, className }: ViralPostProps) {
  const [isVoting, setIsVoting] = useState(false)
  const [selectedVoteAmount, setSelectedVoteAmount] = useState(10)
  
  const voteAmounts = [10, 25, 50, 100]
  
  const handleVote = async (voteType: 'up' | 'down') => {
    setIsVoting(true)
    await onVote(voteType, selectedVoteAmount)
    setIsVoting(false)
  }
  
  const viralLevel = post.viralScore >= 3000 ? 'legendary' : 
                    post.viralScore >= 2000 ? 'viral' : 
                    post.viralScore >= 1000 ? 'trending' : 'rising'
                    
  const viralColor = viralLevel === 'legendary' ? 'from-yellow-400 to-orange-500' :
                     viralLevel === 'viral' ? 'from-red-400 to-pink-500' :
                     viralLevel === 'trending' ? 'from-purple-400 to-blue-500' :
                     'from-green-400 to-teal-500'

  return (
    <Card className={`bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-all duration-300 ${className}`}>
      <CardContent className="p-6">
        {/* Header cu creator info */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12 border-2 border-purple-500/30">
              <AvatarImage src={post.creator.avatar} />
              <AvatarFallback className="bg-purple-600 text-white">
                {post.creator.username?.charAt(0) || post.creator.address.slice(2, 4).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-white">
                  {post.creator.username || post.creator.address}
                </h3>
                {post.isNFT && (
                  <Crown className="w-4 h-4 text-yellow-400" title="NFT Minted" />
                )}
              </div>
              <p className="text-sm text-gray-400">
                {formatDistanceToNow(post.timestamp, { 
                  addSuffix: true, 
                  locale: ro 
                })}
              </p>
            </div>
          </div>
          
          {/* Viral Score Badge */}
          <Badge 
            className={`bg-gradient-to-r ${viralColor} text-white font-bold px-3 py-1 capitalize`}
          >
            <Zap className="w-3 h-3 mr-1" />
            {viralLevel} · {formatNumber(post.viralScore)}
          </Badge>
        </div>
        
        {/* Content */}
        <div className="mb-4">
          <p className="text-gray-200 text-lg leading-relaxed mb-3">
            {post.content}
          </p>
          
          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="bg-slate-700 text-gray-300 hover:bg-purple-600/20"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Media */}
          {post.media && post.media.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {post.media.map((media, index) => (
                <div key={index} className="relative rounded-lg overflow-hidden bg-slate-900">
                  {media.type === 'image' && (
                    <Image
                      src={media.url}
                      alt="Post media"
                      width={400}
                      height={300}
                      className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        // Fallback pentru imagini de demo
                        e.currentTarget.src = `https://picsum.photos/400/300?random=${index}`
                      }}
                    />
                  )}
                  
                  {media.type === 'video' && (
                    <div className="relative w-full h-64 bg-gray-800 flex items-center justify-center">
                      <Play className="w-12 h-12 text-white/70" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <span className="text-white font-medium">Video Preview</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Engagement Stats */}
        <div className="flex items-center space-x-6 mb-4 text-sm text-gray-400">
          <div className="flex items-center space-x-1">
            <Eye className="w-4 h-4" />
            <span>{formatNumber(post.engagement.views)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Share2 className="w-4 h-4" />
            <span>{formatNumber(post.engagement.shares)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle className="w-4 h-4" />
            <span>{formatNumber(post.engagement.comments)}</span>
          </div>
        </div>
        
        {/* Voting Section */}
        <div className="border-t border-slate-700 pt-4">
          <div className="flex items-center justify-between">
            {/* Vote Amount Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Votează cu:</span>
              {voteAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant={selectedVoteAmount === amount ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedVoteAmount(amount)}
                  className={selectedVoteAmount === amount ? 
                    "bg-purple-600 hover:bg-purple-700" : 
                    "border-slate-600 hover:border-purple-500"
                  }
                >
                  {amount} SAFE
                </Button>
              ))}
            </div>
            
            {/* Vote Buttons */}
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleVote('up')}
                disabled={isVoting}
                className="border-green-500/50 text-green-400 hover:bg-green-500/10 hover:border-green-500"
              >
                <ThumbsUp className="w-4 h-4 mr-1" />
                {formatNumber(post.votes.up)}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleVote('down')}
                disabled={isVoting}
                className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
              >
                <ThumbsDown className="w-4 h-4 mr-1" />
                {formatNumber(post.votes.down)}
              </Button>
              
              {post.isNFT && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Vezi NFT
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}