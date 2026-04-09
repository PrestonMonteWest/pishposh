import type { AuthTokens } from '../types/auth'
import type {
  Post,
  CreatePostRequest,
  CreatePostResponse,
  PostsPage,
} from '../types/post'
import { getAuthHeader } from './auth'

const API_BASE_URL = import.meta.env.API_BASE_URL || '/api'

export async function fetchPost(id: string): Promise<Post> {
  const response = await fetch(
    `${API_BASE_URL}/posts/${encodeURIComponent(id)}`,
  )

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || 'Failed to fetch post')
  }

  const data = await response.json()
  return data.post
}

export async function fetchPosts(cursor: string | null): Promise<PostsPage> {
  const params = new URLSearchParams()
  if (cursor) params.set('cursor', cursor)
  params.set('limit', '20')

  const response = await fetch(`${API_BASE_URL}/posts?${params}`)

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || 'Failed to fetch posts')
  }

  return response.json()
}

export async function createPost(
  tokens: AuthTokens,
  data: CreatePostRequest,
): Promise<CreatePostResponse> {
  const response = await fetch(`${API_BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(tokens),
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || 'Failed to create post')
  }

  return response.json()
}
