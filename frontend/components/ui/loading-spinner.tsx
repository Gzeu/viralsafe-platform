import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  text?: string
  fullScreen?: boolean
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
}

export function LoadingSpinner({ 
  size = 'md', 
  className, 
  text,
  fullScreen = false 
}: LoadingSpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 
        className={cn(
          'animate-spin text-primary',
          sizeClasses[size],
          className
        )} 
      />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinner}
      </div>
    )
  }

  return spinner
}

// Inline loading spinner for buttons
export function InlineSpinner({ className, ...props }: { className?: string }) {
  return (
    <Loader2 
      className={cn('h-4 w-4 animate-spin', className)} 
      {...props}
    />
  )
}

// Loading skeleton components
export function LoadingCard({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="rounded-lg bg-muted p-4 space-y-3">
        <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
        <div className="h-4 bg-muted-foreground/20 rounded w-1/2"></div>
        <div className="h-24 bg-muted-foreground/20 rounded"></div>
        <div className="flex gap-2">
          <div className="h-6 bg-muted-foreground/20 rounded w-16"></div>
          <div className="h-6 bg-muted-foreground/20 rounded w-20"></div>
        </div>
      </div>
    </div>
  )
}

export function LoadingAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }

  return (
    <div className={cn(
      'animate-pulse bg-muted rounded-full',
      sizeClasses[size]
    )} />
  )
}

export function LoadingPost() {
  return (
    <div className="animate-pulse border rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <LoadingAvatar />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-muted rounded w-32"></div>
          <div className="h-3 bg-muted rounded w-24"></div>
        </div>
      </div>
      
      {/* Content */}
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-4/5"></div>
        <div className="h-4 bg-muted rounded w-3/5"></div>
      </div>
      
      {/* Media placeholder */}
      <div className="h-64 bg-muted rounded-lg"></div>
      
      {/* Actions */}
      <div className="flex items-center gap-4">
        <div className="h-8 bg-muted rounded w-16"></div>
        <div className="h-8 bg-muted rounded w-16"></div>
        <div className="h-8 bg-muted rounded w-16"></div>
      </div>
    </div>
  )
}

export function LoadingButton({ children, isLoading, ...props }: {
  children: React.ReactNode
  isLoading?: boolean
  [key: string]: any
}) {
  return (
    <button 
      disabled={isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        isLoading && 'opacity-50 cursor-not-allowed',
        props.className
      )}
      {...props}
    >
      {isLoading && <InlineSpinner />}
      {children}
    </button>
  )
}