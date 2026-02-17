import type { AuthTokens } from '../types/auth';
import type { CreatePostRequest, CreatePostResponse } from '../types/post';
import { getAuthHeader } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function createPost(
  tokens: AuthTokens,
  data: CreatePostRequest
): Promise<CreatePostResponse> {
  const response = await fetch(`${API_BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(tokens),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Failed to create post');
  }

  return response.json();
}
