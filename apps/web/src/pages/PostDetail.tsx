import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { VerificationBanner } from '../components/VerificationBanner'
import { VoteButtons } from '../components/VoteButtons'
import { useAuth } from '../hooks/useAuth'
import { fetchPost } from '../services/posts'
import type { Post } from '../types/post'

export function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!id) return

    const controller = new AbortController()

    fetchPost(id, controller.signal)
      .then(setPost)
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err instanceof Error ? err.message : 'Failed to load post')
        }
      })
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [id])

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800 p-4 sticky top-0 bg-black/90 backdrop-blur-sm z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link
            to="/"
            className="text-gray-400 hover:text-white transition-colors"
          >
            &larr; Back
          </Link>
          <h1 className="text-2xl font-bold text-pink-500">PishPosh</h1>
        </div>
      </header>

      {user && !user.emailVerified && <VerificationBanner />}

      <main className="max-w-2xl mx-auto mt-4 pb-4">
        {isLoading && (
          <div className="py-8 text-center text-gray-500">Loading...</div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
            {error}
          </div>
        )}

        {post && (
          <article className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-pink-400">
                @{post.creatorUsername}
              </span>
              <span className="text-sm text-gray-600">&middot;</span>
              <span className="text-sm text-gray-500">
                {formatDate(post.createdAt)}
              </span>
            </div>
            <h2 className="text-2xl font-bold">{post.title}</h2>
            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
              {post.content}
            </p>
            <VoteButtons
              postId={post.id}
              initialScore={post.score}
              initialViewerVote={post.viewerVote}
            />
          </article>
        )}
      </main>
    </div>
  )
}
