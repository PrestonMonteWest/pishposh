import type {
  AuthTokens,
  LoginCredentials,
  SignupCredentials,
  AuthResponse,
} from '../types/auth'

const API_BASE_URL = import.meta.env.API_BASE_URL || '/api'

const TOKEN_STORAGE_KEY = 'pishposh_tokens'

export function getStoredTokens(): AuthTokens | null {
  const stored = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (!stored) return null

  try {
    return JSON.parse(stored) as AuthTokens
  } catch {
    return null
  }
}

export function storeTokens(tokens: AuthTokens): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens))
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export function isTokenExpired(tokens: AuthTokens): boolean {
  const payload = parseJwt(tokens.accessToken)
  if (!payload?.exp) return true
  return Date.now() >= payload.exp * 1000
}

function parseJwt(token: string): { exp?: number } | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const payload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    return JSON.parse(payload)
  } catch {
    return null
  }
}

async function authFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || 'Request failed')
  }

  return response.json()
}

export async function login(
  credentials: LoginCredentials,
): Promise<AuthResponse> {
  const response = await authFetch<AuthResponse>('/oauth/token', {
    method: 'POST',
    body: JSON.stringify({
      grant_type: 'password',
      email: credentials.email,
      password: credentials.password,
    }),
  })

  storeTokens(response.tokens)
  return response
}

export async function signup(
  credentials: SignupCredentials,
): Promise<AuthResponse> {
  const response = await authFetch<AuthResponse>('/oauth/register', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })

  storeTokens(response.tokens)
  return response
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<AuthTokens> {
  const response = await authFetch<{ tokens: AuthTokens }>('/oauth/token', {
    method: 'POST',
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  storeTokens(response.tokens)
  return response.tokens
}

export async function logout(accessToken: string): Promise<void> {
  try {
    await authFetch('/oauth/revoke', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } finally {
    clearTokens()
  }
}

export async function getCurrentUser(
  accessToken: string,
): Promise<AuthResponse['user']> {
  return authFetch('/users/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export function getAuthHeader(
  tokens: AuthTokens | null,
): Record<string, string> {
  if (!tokens) return {}
  return { Authorization: `${tokens.tokenType} ${tokens.accessToken}` }
}
