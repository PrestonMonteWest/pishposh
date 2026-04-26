import { ArrowBigDown, ArrowBigUp } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { voteOnPost } from '../services/posts'
import type { VoteValue } from '../types/post'

interface VoteButtonsProps {
  postId: string
  initialScore: number
  initialViewerVote: VoteValue | null
}

export function VoteButtons({
  postId,
  initialScore,
  initialViewerVote,
}: VoteButtonsProps) {
  const [viewerVote, setViewerVote] = useState<VoteValue | null>(
    initialViewerVote,
  )
  const [score, setScore] = useState(initialScore)
  const [pending, setPending] = useState(false)
  const { isAuthenticated, user } = useAuth()

  async function handleVote(value: VoteValue) {
    if (!isAuthenticated || pending) return

    const previousVote = viewerVote
    const previousScore = score
    const delta = computeDelta(previousVote, value)

    // Optimistic update
    setViewerVote(previousVote === value ? null : value)
    setScore(previousScore + delta)
    setPending(true)

    try {
      const data = await voteOnPost(postId, value)
      setViewerVote(data.userVote)
      setScore(data.score)
    } catch (err) {
      // Roll back
      setViewerVote(previousVote)
      setScore(previousScore)
      console.error('Vote failed', err)
    } finally {
      setPending(false)
    }
  }

  const disabled = !isAuthenticated || !user?.emailVerified || pending

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          handleVote('up')
        }}
        disabled={disabled}
        aria-label={isAuthenticated ? 'Upvote' : 'Sign in to upvote'}
        aria-pressed={viewerVote === 'up'}
        title={isAuthenticated ? undefined : 'Sign in to vote'}
        className={`
          inline-flex items-center px-3 py-1.5 rounded-md border text-sm transition
          disabled:cursor-not-allowed
          ${disabled && !pending ? 'opacity-60' : ''}
          ${
            viewerVote === 'up'
              ? 'bg-green-50 border-green-400 text-green-800 dark:bg-green-950 dark:border-green-700 dark:text-green-300'
              : 'bg-transparent border-neutral-200 text-neutral-500 hover:enabled:bg-neutral-50 dark:border-neutral-800 dark:hover:enabled:bg-neutral-900'
          }
        `}
      >
        <ArrowBigUp
          size={16}
          fill={viewerVote === 'up' ? 'currentColor' : 'none'}
        />
      </button>

      <span
        className={`
          text-sm font-medium min-w-7 text-center tabular-nums transition-colors
          ${viewerVote === 'up' ? 'text-green-800 dark:text-green-300' : ''}
          ${viewerVote === 'down' ? 'text-red-800 dark:text-red-300' : ''}
        `}
      >
        {score}
      </span>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          handleVote('down')
        }}
        disabled={disabled}
        aria-label={isAuthenticated ? 'Downvote' : 'Sign in to downvote'}
        aria-pressed={viewerVote === 'down'}
        title={isAuthenticated ? undefined : 'Sign in to vote'}
        className={`
          inline-flex items-center px-3 py-1.5 rounded-md border text-sm transition
          disabled:cursor-not-allowed
          ${disabled && !pending ? 'opacity-60' : ''}
          ${
            viewerVote === 'down'
              ? 'bg-red-50 border-red-400 text-red-800 dark:bg-red-950 dark:border-red-700 dark:text-red-300'
              : 'bg-transparent border-neutral-200 text-neutral-500 hover:enabled:bg-neutral-50 dark:border-neutral-800 dark:hover:enabled:bg-neutral-900'
          }
        `}
      >
        <ArrowBigDown
          size={16}
          fill={viewerVote === 'down' ? 'currentColor' : 'none'}
        />
      </button>
    </div>
  )
}

function computeDelta(previous: VoteValue | null, next: VoteValue): number {
  if (previous === next) {
    // Retract
    return next === 'up' ? -1 : +1
  }
  if (previous === null) {
    // First vote
    return next === 'up' ? +1 : -1
  }
  // Flip from one to the other
  return next === 'up' ? +2 : -2
}
