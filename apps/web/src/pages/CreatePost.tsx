import { useState, type SubmitEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { createPost } from '../services/posts'

export function CreatePost() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault()
    setError('')

    if (!isAuthenticated) {
      setError('You must be logged in to create a post')
      return
    }

    setIsSubmitting(true)

    try {
      await createPost({ title, content })
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-pink-500">
            PishPosh
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        <h2 className="text-xl font-bold mb-6">Create Post</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm text-gray-400 mb-1">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
              placeholder="Give your post a title"
            />
          </div>

          <div>
            <label
              htmlFor="content"
              className="block text-sm text-gray-400 mb-1"
            >
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={6}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 resize-y"
              placeholder="What's on your mind?"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-500/50 text-white font-semibold rounded transition-colors"
            >
              {isSubmitting ? 'Posting...' : 'Create Post'}
            </button>
            <Link
              to="/"
              className="px-6 py-3 text-gray-400 hover:text-white border border-gray-700 rounded transition-colors text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
