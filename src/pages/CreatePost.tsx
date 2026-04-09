import { useState, type FormEvent, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { createPost } from '../services/posts'
import type { MediaAttachment } from '../types/post'

const ACCEPTED_TYPES = '.png,.gif,.jpg,.jpeg,.webp,.mp4,.mkv,.webm'

export function CreatePost() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { tokens } = useAuth()
  const navigate = useNavigate()

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...newFiles])
      e.target.value = ''
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!tokens) {
      setError('You must be logged in to create a post')
      return
    }

    setIsSubmitting(true)

    try {
      const media: MediaAttachment[] = files.map((file) => ({
        id: '',
        uri: '',
        mimeType: file.type,
        filename: file.name,
      }))

      await createPost(tokens, { title, content, media })
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

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Media Attachments
            </label>
            <label className="inline-flex items-center py-2 px-4 rounded bg-gray-800 text-pink-500 text-sm font-semibold hover:bg-gray-700 cursor-pointer transition-colors">
              Choose Files
              <input
                type="file"
                accept={ACCEPTED_TYPES}
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {files.length > 0 && (
              <span className="ml-3 text-sm text-gray-400">
                {files.length} file{files.length !== 1 ? 's' : ''} selected
              </span>
            )}
            {files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between bg-gray-900 border border-gray-700 rounded px-3 py-2"
                  >
                    <span className="text-sm text-gray-300 truncate">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-400 hover:text-red-300 text-sm ml-3 shrink-0"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
