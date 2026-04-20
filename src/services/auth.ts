import type {
  AuthResponse,
  AuthTokens,
  LoginCredentials,
  SignupCredentials,
} from '../types/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const TOKEN_STORAGE_KEY = 'pishposh_tokens'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

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

// Decodes without verifying — only safe for client-side expiry checks.
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

async function jsonFetch<T = void>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new ApiError(res.status, body.message || 'Request failed')
  }

  return res.json()
}

export async function login(
  credentials: LoginCredentials,
  signal?: AbortSignal,
): Promise<AuthResponse> {
  const res = await jsonFetch<AuthResponse>('/oauth/token', {
    signal,
    method: 'POST',
    body: JSON.stringify({
      grant_type: 'password',
      email: credentials.email,
      password: credentials.password,
    }),
  })

  storeTokens(res.tokens)
  return res
}

export async function signup(
  credentials: SignupCredentials,
  signal?: AbortSignal,
): Promise<AuthResponse> {
  const res = await jsonFetch<AuthResponse>('/oauth/register', {
    signal,
    method: 'POST',
    body: JSON.stringify(credentials),
  })

  storeTokens(res.tokens)
  return res
}

export async function refreshAccessToken(
  refreshToken: string,
  signal?: AbortSignal,
): Promise<AuthTokens> {
  try {
    const res = await jsonFetch<{ tokens: AuthTokens }>('/oauth/token', {
      signal,
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    storeTokens(res.tokens)
    return res.tokens
  } catch (err) {
    // Refresh token is dead — clear local state so the app re-auths.
    // Network errors shouldn't clear; only auth failures.
    if (err instanceof ApiError && (err.status === 401 || err.status === 400)) {
      clearTokens()
    }
    throw err
  }
}

export async function logout(
  accessToken: string,
  signal?: AbortSignal,
): Promise<void> {
  try {
    await jsonFetch('/oauth/revoke', {
      signal,
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
  signal?: AbortSignal,
): Promise<AuthResponse['user']> {
  return jsonFetch('/users/me', {
    signal,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export function getAuthHeaderFromStorage(): Record<string, string> {
  const tokens = getStoredTokens()
  if (!tokens) return {}
  return { Authorization: `${tokens.tokenType} ${tokens.accessToken}` }
}
