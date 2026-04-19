import type { AuthTokens } from '../types/auth'
import type {
  CreatePostRequest,
  CreatePostResponse,
  Post,
  PostsPage,
  VoteResponse,
  VoteValue,
} from '../types/post'
import { getAuthHeader } from './auth'

const API_BASE_URL = import.meta.env.API_BASE_URL || '/api'

export async function fetchPost(id: string): Promise<Post> {
  const res = await fetch(`${API_BASE_URL}/posts/${encodeURIComponent(id)}`)

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || 'Failed to fetch post')
  }

  const data = await res.json()
  return data.post
}

export async function fetchPosts(cursor: string | null): Promise<PostsPage> {
  const params = new URLSearchParams()
  if (cursor) params.set('cursor', cursor)
  params.set('limit', '20')

  const res = await fetch(`${API_BASE_URL}/posts?${params}`)

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || 'Failed to fetch posts')
  }

  return res.json()
}

export async function createPost(
  tokens: AuthTokens,
  req: CreatePostRequest,
): Promise<CreatePostResponse> {
  const res = await fetch(`${API_BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(tokens),
    },
    body: JSON.stringify(req),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || 'Failed to create post')
  }

  const data = await res.json()
  return data.post
}

export async function voteOnPost(
  tokens: AuthTokens,
  postId: string,
  value: VoteValue | null,
): Promise<VoteResponse> {
  const res = await fetch(`/api/posts/${postId}/votes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader(tokens) },
    body: JSON.stringify({ value }),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || 'Failed to vote on post')
  }

  return res.json()
}
