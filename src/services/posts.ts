import type {
  CreatePostRequest,
  CreatePostResponse,
  Post,
  PostsPage,
  VoteResponse,
  VoteValue,
} from '../types/post'
import { getAuthHeaderFromStorage } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export async function fetchPost(
  id: string,
  signal?: AbortSignal,
): Promise<Post> {
  const res = await fetch(`${API_BASE_URL}/posts/${encodeURIComponent(id)}`, {
    signal,
    headers: getAuthHeaderFromStorage(),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || 'Failed to fetch post')
  }

  const data = await res.json()
  return data.post
}

export async function fetchPosts(
  cursor: string | null,
  signal?: AbortSignal,
): Promise<PostsPage> {
  const params = new URLSearchParams()
  if (cursor) params.set('cursor', cursor)
  params.set('limit', '20')

  const res = await fetch(`${API_BASE_URL}/posts?${params}`, {
    signal,
    headers: getAuthHeaderFromStorage(),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || 'Failed to fetch posts')
  }

  return res.json()
}

export async function createPost(
  req: CreatePostRequest,
  signal?: AbortSignal,
): Promise<CreatePostResponse> {
  const res = await fetch(`${API_BASE_URL}/posts`, {
    signal,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaderFromStorage(),
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
  postId: string,
  value: VoteValue | null,
  signal?: AbortSignal,
): Promise<VoteResponse> {
  const res = await fetch(`/api/posts/${postId}/votes`, {
    signal,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaderFromStorage(),
    },
    body: JSON.stringify({ value }),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || 'Failed to vote on post')
  }

  return res.json()
}
