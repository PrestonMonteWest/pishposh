import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { VoteButtons } from '../components/VoteButtons'
import { useAuth } from '../contexts/AuthContext'
import { fetchPosts } from '../services/posts'
import type { Post } from '../types/post'

export function Home() {
  const { user, tokens, logout } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)
  const location = useLocation()

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return
    loadingRef.current = true
    setIsLoading(true)

    try {
      const page = await fetchPosts(nextCursor)
      setPosts((prev) => [...prev, ...page.posts])
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts')
    } finally {
      setIsLoading(false)
      loadingRef.current = false
    }
  }, [tokens, nextCursor, hasMore])

  useEffect(() => {
    loadMore()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  function formatDate(iso: string): string {
    const date = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800 p-4 sticky top-0 bg-black/90 backdrop-blur-sm z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-pink-500">PishPosh</h1>
          <div className="flex items-center gap-4">
            <Link
              to="/create"
              className="px-4 py-2 text-sm bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded transition-colors"
            >
              Create Post
            </Link>
            {user && (
              <>
                <span className="text-gray-400">@{user.username}</span>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Log out
                </button>
              </>
            )}

            {!user && (
              <Link
                to="/login"
                state={{ from: location }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        {posts.length === 0 && !isLoading && !error && (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <p className="text-xl text-gray-400 mb-4">No posts yet</p>
              <p className="text-gray-500 mb-6">
                Be the first to share something!
              </p>
              <Link
                to="/create"
                className="inline-block px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded transition-colors"
              >
                Create Post
              </Link>
            </div>
          </div>
        )}

        {posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/post/${post.id}`}
                className="flex flex-col gap-2 border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-pink-400">
                    @{post.creatorUsername}
                  </span>
                  <span className="text-sm text-gray-600">&middot;</span>
                  <span className="text-sm text-gray-500">
                    {formatDate(post.createdAt)}
                  </span>
                </div>
                <h2 className="text-lg font-semibold">{post.title}</h2>
                <p className="text-gray-300 whitespace-pre-wrap">
                  {post.content}
                </p>
                <VoteButtons
                  postId={post.id}
                  initialScore={post.score}
                  initialViewerVote={post.viewerVote}
                />
              </Link>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="py-8 text-center text-gray-500">Loading...</div>
        )}

        {hasMore && <div ref={sentinelRef} className="h-1" />}

        {!hasMore && posts.length > 0 && (
          <div className="py-8 text-center text-gray-600 text-sm">
            You've reached the end
          </div>
        )}
      </main>
    </div>
  )
}
